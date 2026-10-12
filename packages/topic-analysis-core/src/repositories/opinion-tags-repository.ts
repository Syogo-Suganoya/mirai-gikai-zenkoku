import { createDb, type Db } from "@mirai-gikai/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "@mirai-gikai/db/orm";
import {
  interview_configs,
  interview_opinion,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";
import type { OpinionToTag } from "../utils/build-opinion-tags-prompt";

/** タグ付け対象レポート（1レポート = 1回のLLM呼び出し）。 */
export type TagTargetReport = {
  reportId: string;
  sessionId: string;
  role: string | null;
  roleTitle: string | null;
};

/** 議案に属する意見だけに絞る条件（billId 未指定なら絞らない） */
function billFilter(db: Db, billId: string | undefined) {
  if (!billId) return undefined;
  return inArray(
    interview_opinion.interview_report_id,
    db
      .select({ id: interview_report.id })
      .from(interview_report)
      .innerJoin(
        interview_sessions,
        eq(interview_sessions.id, interview_report.interview_session_id)
      )
      .innerJoin(
        interview_configs,
        eq(interview_configs.id, interview_sessions.interview_config_id)
      )
      .where(eq(interview_configs.bill_id, billId))
  );
}

/** タグ未抽出（tags_extracted_at IS NULL）の意見件数。進捗表示と継続判定に使う。 */
export async function countPendingTagExtraction(
  billId?: string
): Promise<number> {
  const db = createDb();
  const [row] = await db
    .select({ count: count() })
    .from(interview_opinion)
    .where(
      and(billFilter(db, billId), isNull(interview_opinion.tags_extracted_at))
    );
  return row?.count ?? 0;
}

/**
 * タグ未抽出の意見を持つレポートを最大 limit 件返す。
 *
 * タグ付けは1レポート分の意見をまとめて1回のLLM呼び出しで処理するため、対象は
 * レポート単位で束ねる。
 */
export async function findReportsToTag(
  limit: number,
  billId?: string
): Promise<TagTargetReport[]> {
  const db = createDb();
  const targets = await db
    .selectDistinct({ id: interview_opinion.interview_report_id })
    .from(interview_opinion)
    .where(
      and(billFilter(db, billId), isNull(interview_opinion.tags_extracted_at))
    )
    .orderBy(asc(interview_opinion.interview_report_id))
    .limit(limit);
  const reportIds = targets.map((t) => t.id);
  if (reportIds.length === 0) return [];

  // 立場（role / role_title）はプロンプトの接地に使うため別途まとめて引く。
  // 並びは公開同意優先・古い順にするが、対象レポートの集合自体は1段目の
  // interview_report_id 昇順で決まっているので、この並べ替えが効くのは
  // チャンク内の処理順だけ。
  const reports = await db
    .select({
      id: interview_report.id,
      interview_session_id: interview_report.interview_session_id,
      role: interview_report.role,
      role_title: interview_report.role_title,
    })
    .from(interview_report)
    .where(inArray(interview_report.id, reportIds))
    .orderBy(
      desc(interview_report.is_public_by_user),
      asc(interview_report.created_at)
    );

  return reports.map((r) => ({
    reportId: r.id,
    sessionId: r.interview_session_id,
    role: r.role,
    roleTitle: r.role_title,
  }));
}

/** 指定レポートのタグ未抽出の意見を opinion_index 昇順で返す。 */
export async function findUntaggedOpinions(
  reportId: string
): Promise<OpinionToTag[]> {
  return createDb()
    .select({
      opinion_index: interview_opinion.opinion_index,
      title: interview_opinion.title,
      content: interview_opinion.content,
      contextual_quote: interview_opinion.contextual_quote,
      source_message_id: interview_opinion.source_message_id,
    })
    .from(interview_opinion)
    .where(
      and(
        eq(interview_opinion.interview_report_id, reportId),
        isNull(interview_opinion.tags_extracted_at)
      )
    )
    .orderBy(asc(interview_opinion.opinion_index));
}

/** 1意見へ書き込むタグ。 */
export type OpinionTagsUpdate = {
  opinionIndex: number;
  concern: string | null;
  proposal: string | null;
  reasoningTypes: string[];
};

/**
 * 意見のタグ列だけを更新する（title/content 等の本文は触らない）。
 *
 * 本文を作り直さないことが重要。既存の再抽出経路はプロンプトごと意見を再生成するため
 * opinion_index に載る意見の中身が変わり、UUID を参照している topic_opinion の割当が
 * 実質ずれる（公開中のトピック分析の引用が差し替わる）。タグ付けはこれを避けるために
 * 追加専用にしている。
 *
 * 更新条件に `tags_extracted_at IS NULL` を残して compare-and-set にしている。
 * バックフィルは本番稼働中に走るため、対象抽出から更新までの間に同じレポートへ
 * ライブ生成の同期や再抽出が当たることがあり、無条件 UPDATE だと本物のタグを
 * 後から自分の生成結果で上書きしてしまう。
 */
export async function updateOpinionTags(
  reportId: string,
  updates: OpinionTagsUpdate[],
  taggedAtIso: string
): Promise<void> {
  const db = createDb();
  for (const update of updates) {
    await db
      .update(interview_opinion)
      .set({
        concern: update.concern,
        proposal: update.proposal,
        reasoning_types: update.reasoningTypes,
        tags_extracted_at: taggedAtIso,
      })
      .where(
        and(
          eq(interview_opinion.interview_report_id, reportId),
          eq(interview_opinion.opinion_index, update.opinionIndex),
          isNull(interview_opinion.tags_extracted_at)
        )
      );
  }
}

/**
 * LLM が特定の意見を返さなかった場合に、その意見のウォーターマークだけ進める。
 * 進めないと同じレポートが毎チャンク先頭に滞留して前進が止まる。
 */
export async function markOpinionsTagAttempted(
  reportId: string,
  opinionIndexes: number[],
  taggedAtIso: string
): Promise<void> {
  if (opinionIndexes.length === 0) return;
  await createDb()
    .update(interview_opinion)
    .set({ tags_extracted_at: taggedAtIso })
    .where(
      and(
        eq(interview_opinion.interview_report_id, reportId),
        inArray(interview_opinion.opinion_index, opinionIndexes),
        // 直前に立ったライブ生成のウォーターマークを空振りマークで塗り替えない。
        isNull(interview_opinion.tags_extracted_at)
      )
    );
}

/**
 * 指定議案の意見のタグ抽出ウォーターマークを NULL に戻す（scope="all" の起点）。
 */
export async function resetTagExtractionForBill(
  billId: string
): Promise<number> {
  const db = createDb();
  const updated = await db
    .update(interview_opinion)
    .set({ tags_extracted_at: null })
    .where(
      and(
        billFilter(db, billId),
        isNotNull(interview_opinion.tags_extracted_at)
      )
    )
    .returning({ id: interview_opinion.id });
  return updated.length;
}
