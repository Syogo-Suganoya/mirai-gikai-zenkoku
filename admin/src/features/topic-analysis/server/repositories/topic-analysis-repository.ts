import "server-only";

import { createDb, pgErrorCode } from "@mirai-gikai/db";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  sql,
} from "@mirai-gikai/db/orm";
import {
  bill_contents,
  bills,
  interview_configs,
  interview_sessions,
  topic_analysis_classifications,
  topic_analysis_topics,
  topic_analysis_versions,
} from "@mirai-gikai/db/schema";
import type { IntermediateResults, PhaseData } from "../../shared/types";

type VersionRow = typeof topic_analysis_versions.$inferSelect;

/**
 * 新しいバージョンを作成する（version番号は自動インクリメント）
 */
export async function createVersion(billId: string) {
  const db = createDb();

  // 現在の最大バージョン番号を取得
  const [latest] = await db
    .select({ version: topic_analysis_versions.version })
    .from(topic_analysis_versions)
    .where(eq(topic_analysis_versions.bill_id, billId))
    .orderBy(desc(topic_analysis_versions.version))
    .limit(1);

  const [row] = await db
    .insert(topic_analysis_versions)
    .values({
      bill_id: billId,
      version: (latest?.version ?? 0) + 1,
      status: "pending",
    })
    .returning();
  return row;
}

/**
 * バージョンのステータスを更新する
 */
export async function updateVersionStatus(
  versionId: string,
  status: "pending" | "running" | "completed" | "failed",
  errorMessage?: string
) {
  const finished = status === "completed" || status === "failed";
  await createDb()
    .update(topic_analysis_versions)
    .set({
      status,
      error_message: errorMessage ?? null,
      ...(status === "running" ? { started_at: sql`now()` } : {}),
      ...(finished ? { completed_at: sql`now()`, current_step: null } : {}),
    })
    .where(eq(topic_analysis_versions.id, versionId));
}

/**
 * バージョンの現在のステップを更新する
 */
export async function updateVersionStep(
  versionId: string,
  currentStep: string
) {
  await createDb()
    .update(topic_analysis_versions)
    .set({ current_step: currentStep })
    .where(eq(topic_analysis_versions.id, versionId));
}

/**
 * バージョンの解析結果を保存する
 */
export async function updateVersionResult(
  versionId: string,
  summaryMd: string,
  intermediateResults: IntermediateResults
) {
  await createDb()
    .update(topic_analysis_versions)
    .set({
      summary_md: summaryMd,
      intermediate_results:
        intermediateResults as VersionRow["intermediate_results"],
      status: "completed",
      completed_at: sql`now()`,
      current_step: null,
    })
    .where(eq(topic_analysis_versions.id, versionId));
}

/**
 * フェーズ間データを保存する
 */
export async function savePhaseData(versionId: string, phaseData: PhaseData) {
  await createDb()
    .update(topic_analysis_versions)
    .set({ phase_data: phaseData as VersionRow["phase_data"] })
    .where(eq(topic_analysis_versions.id, versionId));
}

/**
 * フェーズ間データを読み込む
 */
export async function loadPhaseData(versionId: string): Promise<PhaseData> {
  const [row] = await createDb()
    .select({ phase_data: topic_analysis_versions.phase_data })
    .from(topic_analysis_versions)
    .where(eq(topic_analysis_versions.id, versionId));

  if (!row) {
    throw new Error(
      `Failed to load phase data: version ${versionId} not found`
    );
  }
  if (!row.phase_data) {
    throw new Error(`Phase data not found for version ${versionId}`);
  }
  return row.phase_data as unknown as PhaseData;
}

/**
 * 議案のバージョン一覧を取得する
 */
export async function findVersionsByBillId(billId: string) {
  return createDb()
    .select()
    .from(topic_analysis_versions)
    .where(eq(topic_analysis_versions.bill_id, billId))
    .orderBy(desc(topic_analysis_versions.version));
}

/**
 * バージョンを ID で取得する
 */
export async function findVersionById(
  versionId: string
): Promise<VersionRow | null> {
  const [row] = await createDb()
    .select()
    .from(topic_analysis_versions)
    .where(eq(topic_analysis_versions.id, versionId));
  return row ?? null;
}

/**
 * トピックを一括作成する
 */
export async function createTopics(
  versionId: string,
  topics: Array<{
    name: string;
    description_md: string;
    representative_opinions: Array<{
      session_id: string;
      opinion_title: string;
      opinion_content: string;
      source_message_content?: string | null;
    }>;
    sort_order: number;
  }>
) {
  if (topics.length === 0) return [];
  return createDb()
    .insert(topic_analysis_topics)
    .values(
      topics.map((topic) => ({
        version_id: versionId,
        name: topic.name,
        description_md: topic.description_md,
        representative_opinions:
          topic.representative_opinions as (typeof topic_analysis_topics.$inferInsert)["representative_opinions"],
        sort_order: topic.sort_order,
      }))
    )
    .returning();
}

/**
 * 分類を一括作成する
 * バッチ挿入でFK制約違反が起きた場合は1件ずつ挿入にフォールバックし、
 * 不正な行をスキップしてレポート全体の出力を継続する
 */
export async function createClassifications(
  versionId: string,
  classifications: Array<{
    interview_report_id: string;
    topic_id: string;
    opinion_index: number;
  }>
) {
  if (classifications.length === 0) return;
  const db = createDb();
  const rows = classifications.map((c) => ({
    version_id: versionId,
    interview_report_id: c.interview_report_id,
    topic_id: c.topic_id,
    opinion_index: c.opinion_index,
  }));

  try {
    await db.insert(topic_analysis_classifications).values(rows);
    return;
  } catch (error) {
    // FK制約違反以外はそのまま失敗にする
    if (pgErrorCode(error) !== "23503") {
      throw new Error(`Failed to create classifications: ${String(error)}`);
    }
    console.warn(
      `[TopicAnalysis] Batch insert failed with FK violation, falling back to row-by-row insert: ${String(error)}`
    );
  }

  // FK制約違反の場合、1件ずつ挿入してエラー行をスキップ
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    try {
      await db.insert(topic_analysis_classifications).values(row);
      inserted++;
    } catch (rowError) {
      console.warn(
        `[TopicAnalysis] Skipped classification (report: ${row.interview_report_id}): ${String(rowError)}`
      );
      skipped++;
    }
  }
  console.log(
    `[TopicAnalysis] Classifications: ${inserted} inserted, ${skipped} skipped`
  );
}

/**
 * バージョンのトピック一覧を取得する
 */
export async function findTopicsByVersionId(versionId: string) {
  return createDb()
    .select()
    .from(topic_analysis_topics)
    .where(eq(topic_analysis_topics.version_id, versionId))
    .orderBy(asc(topic_analysis_topics.sort_order));
}

/**
 * バージョンの分類一覧を取得する
 */
export async function findClassificationsByVersionId(versionId: string) {
  return createDb()
    .select()
    .from(topic_analysis_classifications)
    .where(eq(topic_analysis_classifications.version_id, versionId));
}

/**
 * 議案とコンテンツを取得する
 */
export async function fetchBillWithContents(billId: string) {
  const db = createDb();
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) {
    throw new Error(`Failed to fetch bill: ${billId} not found`);
  }

  const contents = await db
    .select()
    .from(bill_contents)
    .where(eq(bill_contents.bill_id, billId));
  const normalContent = contents.find((c) => c.difficulty_level === "normal");

  return {
    bill,
    billTitle: normalContent?.title ?? bill.name,
    billContent: normalContent?.content ?? "",
    billSummary: normalContent?.summary ?? "",
  };
}

type ReportOpinion = {
  title: string;
  content: string;
  source_message_id?: string | null;
  source_message_content?: string | null;
};

/**
 * 完了済みインタビューセッションのレポート一覧を取得する
 */
export async function fetchCompletedInterviewReports(billId: string) {
  const db = createDb();
  const configs = await db
    .select({ id: interview_configs.id })
    .from(interview_configs)
    .where(eq(interview_configs.bill_id, billId));
  if (configs.length === 0) return [];

  const sessions = await db.query.interview_sessions.findMany({
    columns: { id: true, interview_config_id: true },
    where: and(
      inArray(
        interview_sessions.interview_config_id,
        configs.map((c) => c.id)
      ),
      isNotNull(interview_sessions.completed_at)
    ),
    with: { interview_report: { columns: { id: true, opinions: true } } },
  });

  // レポートが存在し、opinions が null でないものだけを返す
  const reports: Array<{
    session_id: string;
    config_id: string;
    report_id: string;
    opinions: ReportOpinion[];
  }> = [];

  for (const session of sessions) {
    const report = session.interview_report;
    const opinions = Array.isArray(report?.opinions)
      ? (report.opinions as ReportOpinion[])
      : [];
    if (report && opinions.length > 0) {
      reports.push({
        session_id: session.id,
        config_id: session.interview_config_id,
        report_id: report.id,
        opinions,
      });
    }
  }

  return reports;
}
