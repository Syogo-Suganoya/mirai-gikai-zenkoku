import "server-only";

import { createDb, queryRows, uuidArray } from "@mirai-gikai/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  type SQL,
  sql,
} from "@mirai-gikai/db/orm";
import {
  interview_messages,
  interview_rating_feedbacks,
  interview_report,
  interview_sessions,
  report_reactions,
} from "@mirai-gikai/db/schema";
import { isReportAutoPublishEligible } from "@mirai-gikai/shared/report-publication/auto-publish";
import type {
  MessageSearchFilterConfig,
  SessionFilterConfig,
} from "../../shared/types";
import { DEFAULT_SESSION_FILTER } from "../../shared/types";
import { escapeIlikePattern } from "../../shared/utils/escape-ilike-pattern";
import { hasReportLevelSearchFilters } from "../../shared/utils/parse-message-search-filter-params";

/** DB function の絞り込み引数（"all" は null にして絞り込まない） */
function toRpcFilterArgs(filters: SessionFilterConfig): SQL {
  const value = (v: string) => (v !== "all" ? v : null);
  return sql`${value(filters.status)}::text, ${value(filters.visibility)}::text, ${value(filters.stance)}::text, ${value(filters.role)}::text`;
}

function hasReportLevelFilters(filters: SessionFilterConfig): boolean {
  return (
    filters.visibility !== "all" ||
    filters.stance !== "all" ||
    filters.role !== "all" ||
    filters.moderation !== "all"
  );
}

/** セッションの状態での絞り込み */
function sessionStatusCondition(
  status: SessionFilterConfig["status"]
): SQL | undefined {
  if (status === "completed") return isNotNull(interview_sessions.completed_at);
  if (status === "in_progress") {
    return and(
      isNull(interview_sessions.completed_at),
      isNull(interview_sessions.archived_at)
    );
  }
  if (status === "archived") {
    return and(
      isNull(interview_sessions.completed_at),
      isNotNull(interview_sessions.archived_at)
    );
  }
  return undefined;
}

/** レポートの公開状態・立場・役割・モデレーションでの絞り込み */
function reportCondition(filters: SessionFilterConfig): SQL | undefined {
  const conditions: (SQL | undefined)[] = [];
  if (filters.visibility === "public") {
    conditions.push(eq(interview_report.is_public_by_admin, true));
  } else if (filters.visibility === "private") {
    conditions.push(eq(interview_report.is_public_by_admin, false));
  }
  if (filters.stance !== "all") {
    conditions.push(
      eq(
        interview_report.stance,
        filters.stance as typeof interview_report.$inferSelect.stance & string
      )
    );
  }
  if (filters.role !== "all") {
    conditions.push(
      eq(
        interview_report.role,
        filters.role as typeof interview_report.$inferSelect.role & string
      )
    );
  }
  if (filters.moderation === "unscored") {
    conditions.push(isNull(interview_report.moderation_score));
  } else if (filters.moderation !== "all") {
    conditions.push(
      eq(
        interview_report.moderation_status,
        filters.moderation as typeof interview_report.$inferSelect.moderation_status &
          string
      )
    );
  }
  return and(...conditions);
}

/** セッションとレポート（無ければ null）。本家の select("*, interview_report(*)") と同じ形 */
async function selectSessionsWithReport(
  where: SQL | undefined,
  options: {
    innerJoin: boolean;
    orderBy?: SQL;
    offset?: number;
    limit?: number;
  }
) {
  const db = createDb();
  const base = db
    .select({ session: interview_sessions, report: interview_report })
    .from(interview_sessions);
  const joined = options.innerJoin
    ? base.innerJoin(
        interview_report,
        eq(interview_report.interview_session_id, interview_sessions.id)
      )
    : base.leftJoin(
        interview_report,
        eq(interview_report.interview_session_id, interview_sessions.id)
      );
  let query = joined.where(where).$dynamic();
  if (options.orderBy) query = query.orderBy(options.orderBy);
  if (options.offset !== undefined) query = query.offset(options.offset);
  if (options.limit !== undefined) query = query.limit(options.limit);
  const rows = await query;
  return rows.map((row) => ({
    ...row.session,
    interview_report: row.report ?? null,
  }));
}

/** 並び替えに使える列（本家の orderBy.column） */
const SESSION_ORDER_COLUMNS = {
  started_at: interview_sessions.started_at,
  completed_at: interview_sessions.completed_at,
  rating: interview_sessions.rating,
} as const;

export async function findInterviewSessionsWithReport(
  configId: string,
  from: number,
  to: number,
  orderBy: {
    column: string;
    ascending: boolean;
  } = { column: "started_at", ascending: false },
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
) {
  const useInnerJoin = hasReportLevelFilters(filters);
  const column =
    SESSION_ORDER_COLUMNS[
      orderBy.column as keyof typeof SESSION_ORDER_COLUMNS
    ] ?? interview_sessions.started_at;

  return selectSessionsWithReport(
    and(
      eq(interview_sessions.interview_config_id, configId),
      sessionStatusCondition(filters.status),
      useInnerJoin ? reportCondition(filters) : undefined
    ),
    {
      innerJoin: useInnerJoin,
      orderBy: orderBy.ascending ? asc(column) : desc(column),
      offset: from,
      limit: to - from + 1,
    }
  );
}

async function findSessionIdsByFunction(
  functionName: SQL,
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig
): Promise<string[]> {
  const rows = await queryRows<{ session_id: string }>(
    createDb(),
    sql`select session_id from ${functionName}(
      ${configId}::uuid, ${ascending}, ${offset}::integer, ${limit}::integer,
      ${toRpcFilterArgs(filters)}
    )`
  );
  return rows.map((row) => row.session_id);
}

export async function findSessionIdsOrderedByMessageCount(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  return findSessionIdsByFunction(
    sql.raw("find_sessions_ordered_by_message_count"),
    configId,
    ascending,
    offset,
    limit,
    filters
  );
}

export async function findInterviewSessionsWithReportByIds(
  sessionIds: string[]
) {
  if (sessionIds.length === 0) return [];
  const rows = await selectSessionsWithReport(
    inArray(interview_sessions.id, sessionIds),
    { innerJoin: false }
  );

  // Preserve the order of sessionIds
  const dataMap = new Map(rows.map((s) => [s.id, s]));
  return sessionIds
    .map((id) => dataMap.get(id))
    .filter((row): row is (typeof rows)[number] => row !== undefined);
}

export async function findFilteredSessionIds(
  configId: string,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  const db = createDb();

  // レポートレベルフィルタがある場合はレポートと結合して絞る
  if (hasReportLevelFilters(filters)) {
    const rows = await db
      .select({ id: interview_sessions.id })
      .from(interview_report)
      .innerJoin(
        interview_sessions,
        eq(interview_sessions.id, interview_report.interview_session_id)
      )
      .where(
        and(
          eq(interview_sessions.interview_config_id, configId),
          sessionStatusCondition(filters.status),
          reportCondition(filters)
        )
      );
    return rows.map((row) => row.id);
  }

  // セッションレベルフィルタのみの場合
  const rows = await db
    .select({ id: interview_sessions.id })
    .from(interview_sessions)
    .where(
      and(
        eq(interview_sessions.interview_config_id, configId),
        sessionStatusCondition(filters.status)
      )
    );
  return rows.map((row) => row.id);
}

export async function findSessionIdsOrderedByTotalContentRichness(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  return findSessionIdsByFunction(
    sql.raw("find_sessions_ordered_by_total_content_richness"),
    configId,
    ascending,
    offset,
    limit,
    filters
  );
}

export async function findSessionIdsOrderedByHelpfulCount(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  return findSessionIdsByFunction(
    sql.raw("find_sessions_ordered_by_helpful_count"),
    configId,
    ascending,
    offset,
    limit,
    filters
  );
}

export async function findSessionIdsOrderedByModerationScore(
  configId: string,
  ascending: boolean,
  offset: number,
  limit: number,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<string[]> {
  return findSessionIdsByFunction(
    sql.raw("find_sessions_ordered_by_moderation_score"),
    configId,
    ascending,
    offset,
    limit,
    filters
  );
}

export async function findHelpfulCountsByReportIds(
  reportIds: string[]
): Promise<Map<string, number>> {
  const countsMap = new Map<string, number>();
  if (reportIds.length === 0) return countsMap;

  const rows = await queryRows<{
    interview_report_id: string;
    reaction_type: string;
    cnt: string | number;
  }>(
    createDb(),
    sql`select * from count_reactions_by_report_ids(${uuidArray(reportIds)})`
  );

  for (const row of rows) {
    if (row.reaction_type === "helpful") {
      countsMap.set(row.interview_report_id, Number(row.cnt));
    }
  }

  return countsMap;
}

export async function findInterviewMessageCounts(sessionIds: string[]) {
  if (sessionIds.length === 0) return [];
  const rows = await queryRows<{
    interview_session_id: string;
    message_count: string | number;
  }>(
    createDb(),
    sql`select * from get_interview_message_counts(${uuidArray(sessionIds)})`
  );
  return rows.map((row) => ({
    interview_session_id: row.interview_session_id,
    message_count: Number(row.message_count),
  }));
}

export async function countInterviewSessionsByConfigId(
  configId: string,
  filters: SessionFilterConfig = DEFAULT_SESSION_FILTER
): Promise<number> {
  const useInnerJoin = hasReportLevelFilters(filters);
  const db = createDb();
  const where = and(
    eq(interview_sessions.interview_config_id, configId),
    sessionStatusCondition(filters.status),
    useInnerJoin ? reportCondition(filters) : undefined
  );

  const [row] = useInnerJoin
    ? await db
        .select({ count: count() })
        .from(interview_sessions)
        .innerJoin(
          interview_report,
          eq(interview_report.interview_session_id, interview_sessions.id)
        )
        .where(where)
    : await db.select({ count: count() }).from(interview_sessions).where(where);

  return row?.count ?? 0;
}

export async function findInterviewSessionById(sessionId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_sessions)
    .where(eq(interview_sessions.id, sessionId));
  if (!row) {
    throw new Error("Failed to fetch interview session: not found");
  }
  return row;
}

export async function findInterviewReportBySessionId(
  sessionId: string
): Promise<typeof interview_report.$inferSelect | null> {
  const [row] = await createDb()
    .select()
    .from(interview_report)
    .where(eq(interview_report.interview_session_id, sessionId));
  return row ?? null;
}

export async function findInterviewMessagesBySessionId(sessionId: string) {
  return createDb()
    .select()
    .from(interview_messages)
    .where(eq(interview_messages.interview_session_id, sessionId))
    .orderBy(asc(interview_messages.created_at));
}

export async function searchUserMessagesByConfigId(
  configId: string,
  query: string,
  limit: number,
  filters: MessageSearchFilterConfig
) {
  const db = createDb();
  const columns = {
    id: interview_messages.id,
    interview_session_id: interview_messages.interview_session_id,
    content: interview_messages.content,
    created_at: interview_messages.created_at,
  };
  const messageCondition = and(
    eq(interview_messages.role, "user"),
    eq(interview_sessions.interview_config_id, configId),
    ilike(interview_messages.content, `%${escapeIlikePattern(query)}%`)
  );

  // レポートレベルのフィルタ指定時のみ interview_report まで結合し、
  // レポート未生成のセッションを除外する。
  if (hasReportLevelSearchFilters(filters)) {
    return db
      .select(columns)
      .from(interview_messages)
      .innerJoin(
        interview_sessions,
        eq(interview_sessions.id, interview_messages.interview_session_id)
      )
      .innerJoin(
        interview_report,
        eq(interview_report.interview_session_id, interview_sessions.id)
      )
      .where(
        and(
          messageCondition,
          filters.stance !== "all"
            ? eq(
                interview_report.stance,
                filters.stance as typeof interview_report.$inferSelect.stance &
                  string
              )
            : undefined,
          filters.role !== "all"
            ? eq(
                interview_report.role,
                filters.role as typeof interview_report.$inferSelect.role &
                  string
              )
            : undefined,
          filters.roleTitle !== ""
            ? ilike(
                interview_report.role_title,
                `%${escapeIlikePattern(filters.roleTitle)}%`
              )
            : undefined
        )
      )
      .orderBy(desc(interview_messages.created_at))
      .limit(limit);
  }

  return db
    .select(columns)
    .from(interview_messages)
    .innerJoin(
      interview_sessions,
      eq(interview_sessions.id, interview_messages.interview_session_id)
    )
    .where(messageCondition)
    .orderBy(desc(interview_messages.created_at))
    .limit(limit);
}

export async function findReactionCountsByReportId(
  reportId: string
): Promise<{ helpful: number }> {
  const [row] = await createDb()
    .select({ count: count() })
    .from(report_reactions)
    .where(
      and(
        eq(report_reactions.interview_report_id, reportId),
        eq(report_reactions.reaction_type, "helpful")
      )
    );
  return { helpful: row?.count ?? 0 };
}

export async function findFeedbackTagsBySessionId(
  sessionId: string
): Promise<string[]> {
  const rows = await createDb()
    .select({ tag: interview_rating_feedbacks.tag })
    .from(interview_rating_feedbacks)
    .where(eq(interview_rating_feedbacks.interview_session_id, sessionId));
  return rows.map((row) => row.tag);
}

export type InterviewMetricsByBillRow = {
  bill_id: string;
  bill_name: string;
  conducted_count: number;
  completed_count: number;
  completion_rate: number;
  total_duration_seconds: number;
  total_duration_seconds_under_1h: number;
};

/** numeric・bigint（文字列で返る）を数値にする。null はそのまま */
function toNumberOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * 議案ごとのAIインタビュー実施数・完了数・完了率・総回答時間（1時間以上のセッション除外版を含む）を取得する。
 * billId を指定すると単一議案に絞り込み、省略すると設定を持つ全議案を返す。
 */
export async function findInterviewMetricsByBill(
  billId?: string
): Promise<InterviewMetricsByBillRow[]> {
  const rows = await queryRows<Record<string, unknown>>(
    createDb(),
    sql`select * from get_interview_metrics_by_bill(${billId ?? null}::uuid)`
  );
  return rows.map((row) => ({
    bill_id: String(row.bill_id),
    bill_name: String(row.bill_name),
    conducted_count: Number(row.conducted_count),
    completed_count: Number(row.completed_count),
    completion_rate: Number(row.completion_rate),
    total_duration_seconds: Number(row.total_duration_seconds),
    total_duration_seconds_under_1h: Number(
      row.total_duration_seconds_under_1h
    ),
  }));
}

/** get_interview_statistics の列のうち、平均・中央値など null になりうるもの */
const NULLABLE_STAT_COLUMNS = new Set([
  "avg_rating",
  "avg_total_content_richness",
  "avg_message_count",
  "median_duration_seconds",
  "total_duration_seconds",
  "total_duration_seconds_under_1h",
]);

export async function findInterviewStatistics(configId: string) {
  const [row] = await queryRows<Record<string, unknown>>(
    createDb(),
    sql`select * from get_interview_statistics(${configId}::uuid)`
  );
  if (!row) return null;
  const stats = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      NULLABLE_STAT_COLUMNS.has(key)
        ? toNumberOrNull(value)
        : Number(value ?? 0),
    ])
  );
  return stats as Parameters<
    typeof import("../../shared/utils/map-interview-statistics").mapInterviewStatistics
  >[0];
}

export async function findQuestionAnswerCounts(configId: string) {
  const rows = await queryRows<{
    question_id: string;
    question: string;
    question_order: number;
    asked_session_count: string | number;
    answered_session_count: string | number;
  }>(
    createDb(),
    sql`select * from get_question_answer_counts(${configId}::uuid)`
  );
  return rows.map((row) => ({
    question_id: row.question_id,
    question: row.question,
    question_order: Number(row.question_order),
    asked_session_count: Number(row.asked_session_count),
    answered_session_count: Number(row.answered_session_count),
  }));
}

export async function updateReportVisibility(
  reportId: string,
  isPublic: boolean
): Promise<void> {
  // 非公開にした管理者判断を admin_unpublished_at に記録し、ユーザー操作による
  // 自動公開で公開停止が覆されないようにする。公開に戻した場合は記録を消す。
  await createDb()
    .update(interview_report)
    .set({
      is_public_by_admin: isPublic,
      admin_unpublished_at: isPublic ? null : sql`now()`,
    })
    .where(eq(interview_report.id, reportId));
}

const moderationColumns = {
  id: interview_report.id,
  interview_session_id: interview_report.interview_session_id,
  summary: interview_report.summary,
  opinions: interview_report.opinions,
  role_description: interview_report.role_description,
};

export async function findReportForModerationScoringById(reportId: string) {
  const [row] = await createDb()
    .select(moderationColumns)
    .from(interview_report)
    .where(eq(interview_report.id, reportId));
  return row ?? null;
}

export async function findReportsForModerationScoring() {
  return createDb()
    .select(moderationColumns)
    .from(interview_report)
    .orderBy(asc(interview_report.id));
}

/**
 * モデレーション未評価のレポートIDのみを取得する
 */
export async function findUnscoredReportIds(): Promise<string[]> {
  const rows = await createDb()
    .select({ id: interview_report.id })
    .from(interview_report)
    .where(isNull(interview_report.moderation_score))
    .orderBy(asc(interview_report.id));
  return rows.map((row) => row.id);
}

/**
 * 全レポートIDを取得する（再評価用）
 */
export async function findAllReportIds(): Promise<string[]> {
  const rows = await createDb()
    .select({ id: interview_report.id })
    .from(interview_report)
    .orderBy(asc(interview_report.id));
  return rows.map((row) => row.id);
}

export async function updateModerationScore(
  reportId: string,
  params: {
    score: number;
    reasoning: string;
  }
): Promise<void> {
  await createDb()
    .update(interview_report)
    .set({
      moderation_score: params.score,
      moderation_reasoning: params.reasoning,
    })
    .where(eq(interview_report.id, reportId));

  await publishReportIfAutoPublishEligible(reportId);
}

export async function updateContentRichness(
  reportId: string,
  contentRichness: {
    total: number;
    clarity: number;
    specificity: number;
    impact: number;
    constructiveness: number;
    reasoning: string;
  }
): Promise<void> {
  await createDb()
    .update(interview_report)
    .set({ content_richness: contentRichness })
    .where(eq(interview_report.id, reportId));

  await publishReportIfAutoPublishEligible(reportId);
}

export async function publishReportIfAutoPublishEligible(
  reportId: string
): Promise<boolean> {
  const db = createDb();
  const [report] = await db
    .select({
      is_public_by_user: interview_report.is_public_by_user,
      is_public_by_admin: interview_report.is_public_by_admin,
      moderation_score: interview_report.moderation_score,
      total_content_richness: interview_report.total_content_richness,
    })
    .from(interview_report)
    .where(eq(interview_report.id, reportId));

  if (!report) {
    throw new Error("Failed to fetch report for auto publish: not found");
  }

  if (
    report.is_public_by_admin ||
    !isReportAutoPublishEligible({
      isPublicByUser: report.is_public_by_user,
      moderationScore: report.moderation_score,
      totalContentRichness: report.total_content_richness,
    })
  ) {
    return false;
  }

  await db
    .update(interview_report)
    .set({ is_public_by_admin: true })
    .where(eq(interview_report.id, reportId));

  return true;
}
