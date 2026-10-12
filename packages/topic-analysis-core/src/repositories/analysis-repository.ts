import { createDb, isUniqueViolation } from "@mirai-gikai/db";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  or,
  sql,
} from "@mirai-gikai/db/orm";
import {
  bill_contents,
  bills,
  interview_configs,
  interview_opinion,
  interview_report,
  interview_sessions,
  topic,
  topic_analysis_version,
  topic_opinion,
} from "@mirai-gikai/db/schema";
import type {
  BillContext,
  ProgressData,
  TargetOpinion,
} from "../shared/types";
import type { HierarchyTopicRow } from "../utils/build-hierarchy-save-plan";
import {
  hasLinkedOpinion,
  selectLeafTopics,
} from "../utils/select-leaf-topics";

type VersionStatus = "pending" | "running" | "completed" | "failed";

type TargetOpinionRow = {
  id: string;
  opinion_index: number;
  title: string;
  content: string;
  contextual_quote: string | null;
  bill_sentiment: string | null;
  richness: number | null;
  topic_extracted_at: string | null;
  interview_report_id: string;
  role: string | null;
};

/**
 * 1回の取得で読むページ幅。巨大な議案でも1クエリの結果が膨らみすぎないよう、
 * この幅でページネーションする。
 */
const TARGET_OPINIONS_PAGE_SIZE = 500;

/**
 * §8 フィルタ後の分析対象意見を取得する。
 * interview_opinion
 * → interview_report(is_public_by_admin=true, is_public_by_user=true, moderation_status='ok')
 * → interview_sessions → interview_configs(bill_id) を辿る。
 * 管理者公開・ユーザー公開の両方に同意済みで、かつモデレーションOKの意見のみ分析対象とする。
 */
export async function fetchTargetOpinions(
  billId: string
): Promise<TargetOpinion[]> {
  const db = createDb();
  const all: TargetOpinion[] = [];

  // keyset(カーソル)ページネーション。(interview_report_id, opinion_index) は一意なので、
  // 「直前ページ末尾より後ろ」を順に読む。offset 方式と違い、取得中に新規意見が挿入されても
  // 既読行のズレ（重複・取りこぼし）が起きない（report_id はランダム UUID のため offset では危険）。
  let cursor: { reportId: string; opinionIndex: number } | null = null;

  for (;;) {
    const rows: TargetOpinionRow[] = await db
      .select({
        id: interview_opinion.id,
        opinion_index: interview_opinion.opinion_index,
        title: interview_opinion.title,
        content: interview_opinion.content,
        contextual_quote: interview_opinion.contextual_quote,
        bill_sentiment: interview_opinion.bill_sentiment,
        richness: interview_opinion.richness,
        topic_extracted_at: interview_opinion.topic_extracted_at,
        interview_report_id: interview_opinion.interview_report_id,
        role: interview_report.role,
      })
      .from(interview_opinion)
      .innerJoin(
        interview_report,
        eq(interview_report.id, interview_opinion.interview_report_id)
      )
      .innerJoin(
        interview_sessions,
        eq(interview_sessions.id, interview_report.interview_session_id)
      )
      .innerJoin(
        interview_configs,
        eq(interview_configs.id, interview_sessions.interview_config_id)
      )
      .where(
        and(
          eq(interview_report.is_public_by_admin, true),
          eq(interview_report.is_public_by_user, true),
          eq(interview_report.moderation_status, "ok"),
          eq(interview_configs.bill_id, billId),
          cursor
            ? or(
                gt(interview_opinion.interview_report_id, cursor.reportId),
                and(
                  eq(interview_opinion.interview_report_id, cursor.reportId),
                  gt(interview_opinion.opinion_index, cursor.opinionIndex)
                )
              )
            : undefined
        )
      )
      .orderBy(
        asc(interview_opinion.interview_report_id),
        asc(interview_opinion.opinion_index)
      )
      .limit(TARGET_OPINIONS_PAGE_SIZE);

    for (const row of rows) {
      all.push({
        opinion_id: row.id,
        interview_report_id: row.interview_report_id,
        opinion_index: row.opinion_index,
        title: row.title,
        content: row.content,
        contextual_quote: row.contextual_quote,
        bill_sentiment: row.bill_sentiment,
        role: row.role ?? null,
        richness: row.richness ?? null,
        topic_extracted_at: row.topic_extracted_at ?? null,
      });
    }

    if (rows.length < TARGET_OPINIONS_PAGE_SIZE) break;
    const last = rows[rows.length - 1];
    cursor = {
      reportId: last.interview_report_id,
      opinionIndex: last.opinion_index,
    };
  }

  return all;
}

/**
 * 指定意見にトピック抽出済みウォーターマーク(topic_extracted_at)を記録する（増分用）。
 * 次回以降の増分抽出で「新規(未抽出)」対象から外すため。
 * 1つの UPDATE で一括更新する（部分更新を残さない）。
 */
export async function markOpinionsExtracted(
  opinionIds: string[]
): Promise<void> {
  if (opinionIds.length === 0) return;
  await createDb()
    .update(interview_opinion)
    .set({ topic_extracted_at: new Date().toISOString() })
    .where(inArray(interview_opinion.id, opinionIds));
}

/** 全議案の id・タイトルを取得する（全議案トピック分析の対象列挙・ログ表示用）。 */
export async function listAllBills(): Promise<
  Array<{ id: string; name: string }>
> {
  return createDb()
    .select({ id: bills.id, name: bills.name })
    .from(bills)
    .where(eq(bills.is_dummy, false));
}

/** 議案コンテキスト（プロンプト接地用）を取得する。本文は bill_contents（normal）から。 */
export async function fetchBillContext(billId: string): Promise<BillContext> {
  const db = createDb();
  const [bill] = await db
    .select({ name: bills.name })
    .from(bills)
    .where(eq(bills.id, billId));
  if (!bill) {
    throw new Error(`Failed to fetch bill: ${billId} not found`);
  }

  const contents = await db
    .select({
      summary: bill_contents.summary,
      content: bill_contents.content,
      difficulty_level: bill_contents.difficulty_level,
    })
    .from(bill_contents)
    .where(eq(bill_contents.bill_id, billId));
  const normal =
    contents.find((c) => c.difficulty_level === "normal") ?? contents[0];

  return {
    name: bill.name,
    summary: normal?.summary ?? null,
    body: normal?.content ?? null,
  };
}

/** bill 内で running/pending の version があれば返す（二重起動防止用・§5.3）。 */
export async function findActiveVersionByBill(billId: string) {
  const [row] = await createDb()
    .select({
      id: topic_analysis_version.id,
      status: topic_analysis_version.status,
      started_at: topic_analysis_version.started_at,
      created_at: topic_analysis_version.created_at,
    })
    .from(topic_analysis_version)
    .where(
      and(
        eq(topic_analysis_version.bill_id, billId),
        inArray(topic_analysis_version.status, ["pending", "running"])
      )
    )
    .orderBy(desc(topic_analysis_version.created_at))
    .limit(1);
  return row ?? null;
}

/** 新しい version を作成する（bill 内連番）。 */
export async function createVersion(
  billId: string,
  trigger: "manual" | "cron",
  model: string,
  promptVersion: string
) {
  const db = createDb();
  const [last] = await db
    .select({ version: topic_analysis_version.version })
    .from(topic_analysis_version)
    .where(eq(topic_analysis_version.bill_id, billId))
    .orderBy(desc(topic_analysis_version.version))
    .limit(1);
  const nextVersion = (last?.version ?? 0) + 1;

  try {
    const [row] = await db
      .insert(topic_analysis_version)
      .values({
        bill_id: billId,
        version: nextVersion,
        status: "pending",
        trigger,
        model,
        prompt_version: promptVersion,
      })
      .returning();
    return row;
  } catch (error) {
    // 一意制約違反（23505）= 同時実行で既に active な version が作られた／同一 version 番号が衝突した。
    // one_active_version_per_bill による二重起動ガードに弾かれたケースなので、
    // エラーにせず null を返して呼び出し側でスキップ扱いにする（TOCTOU 対策）。
    if (isUniqueViolation(error)) {
      return null;
    }
    throw error;
  }
}

export async function updateVersionStatus(
  versionId: string,
  status: VersionStatus,
  errorMessage?: string
): Promise<void> {
  await createDb()
    .update(topic_analysis_version)
    .set({
      status,
      ...(status === "running" && { started_at: new Date().toISOString() }),
      ...(errorMessage !== undefined && { error_message: errorMessage }),
    })
    .where(eq(topic_analysis_version.id, versionId));
}

export async function updateVersionStep(
  versionId: string,
  step: string
): Promise<void> {
  await createDb()
    .update(topic_analysis_version)
    .set({ current_step: step })
    .where(eq(topic_analysis_version.id, versionId));
}

export async function saveProgress(
  versionId: string,
  progress: ProgressData
): Promise<void> {
  await createDb()
    .update(topic_analysis_version)
    .set({ progress: progress as never })
    .where(eq(topic_analysis_version.id, versionId));
}

export async function loadProgress(versionId: string): Promise<ProgressData> {
  const [row] = await createDb()
    .select({ progress: topic_analysis_version.progress })
    .from(topic_analysis_version)
    .where(eq(topic_analysis_version.id, versionId));
  if (!row) {
    throw new Error(`Failed to load progress: version ${versionId} not found`);
  }
  if (!row.progress) {
    throw new Error(`Progress not found for version ${versionId}`);
  }
  return row.progress as unknown as ProgressData;
}

/**
 * 階層トピックと意見の紐付けを保存する。
 *
 * 親を先に insert して id を確定させ、その id を子の parent_topic_id に載せる。
 * sort_order は平坦化後の並び順（大トピック → 配下の中トピック）。
 * 親・子・紐付けを1つのトランザクションで保存する。
 */
export async function saveTopicsAndAssignments(
  versionId: string,
  topics: HierarchyTopicRow[],
  assignments: Array<{ opinion_id: string; topic_index: number }>
): Promise<void> {
  if (topics.length === 0) return;

  await createDb().transaction(async (tx) => {
    const idBySortOrder = new Map<number, string>();

    const insertRows = async (
      rows: Array<{
        version_id: string;
        title: string;
        description: string;
        sort_order: number;
        parent_topic_id: string | null;
      }>
    ) => {
      if (rows.length === 0) return;
      const inserted = await tx
        .insert(topic)
        .values(rows)
        .returning({ id: topic.id, sort_order: topic.sort_order });
      for (const row of inserted) {
        idBySortOrder.set(row.sort_order, row.id);
      }
    };

    const parents: HierarchyTopicRow[] = [];
    const children: Array<HierarchyTopicRow & { parent_sort_order: number }> =
      [];
    for (const t of topics) {
      if (t.parent_sort_order === null) {
        parents.push(t);
      } else {
        children.push({ ...t, parent_sort_order: t.parent_sort_order });
      }
    }

    await insertRows(
      parents.map((t) => ({
        version_id: versionId,
        title: t.title,
        description: t.description,
        sort_order: t.sort_order,
        parent_topic_id: null,
      }))
    );

    const childRows = children.map((t) => {
      const parentId = idBySortOrder.get(t.parent_sort_order);
      if (!parentId) {
        throw new Error(
          `Failed to insert topics: parent not found for sort_order=${t.sort_order}`
        );
      }
      return {
        version_id: versionId,
        title: t.title,
        description: t.description,
        sort_order: t.sort_order,
        parent_topic_id: parentId,
      };
    });
    await insertRows(childRows);

    const topicOpinionRows = assignments
      .map((a) => {
        const topicId = idBySortOrder.get(a.topic_index);
        return topicId
          ? {
              version_id: versionId,
              opinion_id: a.opinion_id,
              topic_id: topicId,
            }
          : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (topicOpinionRows.length > 0) {
      await tx.insert(topic_opinion).values(topicOpinionRows);
    }
  });
}

/** 完了処理（status=completed, current_step=done, 件数・時刻を記録）。 */
export async function finalizeVersion(
  versionId: string,
  sourceOpinionCount: number
): Promise<void> {
  await createDb()
    .update(topic_analysis_version)
    .set({
      status: "completed",
      current_step: "done",
      source_opinion_count: sourceOpinionCount,
      completed_at: new Date().toISOString(),
      progress: null,
    })
    .where(eq(topic_analysis_version.id, versionId));
}

/**
 * version を公開する（§7）。「旧公開版を降ろす → 対象を公開」を DB 関数で
 * 単一トランザクション実行し、公開版が0件になる瞬間を外部から不可視にする。
 * one_published_per_bill（bill ごと公開は最大1版）も満たす。
 */
export async function publishVersion(versionId: string): Promise<void> {
  await createDb().execute(
    sql`select publish_topic_analysis_version(${versionId}::uuid)`
  );
}

/** 公開/非公開を切り替える（Admin 手動操作・§7）。 */
export async function setVersionPublished(
  versionId: string,
  published: boolean
): Promise<void> {
  if (published) {
    await publishVersion(versionId);
    return;
  }
  await createDb()
    .update(topic_analysis_version)
    .set({ is_published: false })
    .where(eq(topic_analysis_version.id, versionId));
}

/** ステータス取得（UI ポーリング用）。 */
export async function getVersionStatus(versionId: string) {
  const [row] = await createDb()
    .select({
      id: topic_analysis_version.id,
      bill_id: topic_analysis_version.bill_id,
      version: topic_analysis_version.version,
      status: topic_analysis_version.status,
      current_step: topic_analysis_version.current_step,
      source_opinion_count: topic_analysis_version.source_opinion_count,
      error_message: topic_analysis_version.error_message,
      started_at: topic_analysis_version.started_at,
      completed_at: topic_analysis_version.completed_at,
    })
    .from(topic_analysis_version)
    .where(eq(topic_analysis_version.id, versionId));
  if (!row) {
    throw new Error(`Failed to get version status: ${versionId} not found`);
  }
  return row;
}

/** bill のバージョン一覧（結果ビュー用）。 */
export async function listVersionsByBill(billId: string) {
  return createDb()
    .select({
      id: topic_analysis_version.id,
      version: topic_analysis_version.version,
      status: topic_analysis_version.status,
      is_published: topic_analysis_version.is_published,
      current_step: topic_analysis_version.current_step,
      source_opinion_count: topic_analysis_version.source_opinion_count,
      created_at: topic_analysis_version.created_at,
      completed_at: topic_analysis_version.completed_at,
    })
    .from(topic_analysis_version)
    .where(eq(topic_analysis_version.bill_id, billId))
    .orderBy(desc(topic_analysis_version.version));
}

/**
 * トピックを個別削除する（Admin 手動操作）。
 * LLM の誤割当でタイトル・概要と紐づく意見が整合しないトピックを取り除くための操作。
 * versionId も条件に入れて別 version の同名 topic を誤削除しないようにする。
 * topic_opinion（割当）は FK ON DELETE CASCADE で自動削除される（意見自体は削除されない）。
 */
export async function deleteTopic(
  topicId: string,
  versionId: string
): Promise<void> {
  const deleted = await createDb()
    .delete(topic)
    .where(and(eq(topic.id, topicId), eq(topic.version_id, versionId)))
    .returning({ id: topic.id });
  if (deleted.length === 0) {
    throw new Error(`Topic not found: ${topicId}`);
  }
}

/** version のトピックと割当意見（結果ビュー用）。 */
export async function getTopicsWithOpinions(versionId: string) {
  return createDb().query.topic.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      sort_order: true,
      parent_topic_id: true,
    },
    where: eq(topic.version_id, versionId),
    orderBy: asc(topic.sort_order),
    with: {
      topic_opinion: {
        columns: {},
        with: {
          interview_opinion: {
            columns: {
              id: true,
              title: true,
              content: true,
              contextual_quote: true,
              bill_sentiment: true,
              richness: true,
            },
          },
        },
      },
    },
  });
}

/**
 * 葉トピック（意見が紐づくトピック）だけを返す。
 *
 * 増分分析の既存トピックと、階層UIを持たない画面の表示はこちらを使う。
 * 大トピックを混ぜると割当先候補になり、意見が大トピックに直接付いて
 * 「意見は葉にだけ紐づく」という不変条件が崩れる。
 * 判定は意見の有無なので、子を全部削除されて子なしになった親も落ちる。
 */
export async function getLeafTopicsWithOpinions(versionId: string) {
  return selectLeafTopics(
    await getTopicsWithOpinions(versionId),
    hasLinkedOpinion
  );
}
