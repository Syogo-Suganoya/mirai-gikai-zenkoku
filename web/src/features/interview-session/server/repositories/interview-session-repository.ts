import "server-only";

import { createDb, type Enums } from "@mirai-gikai/db";
import { and, asc, desc, eq, isNull } from "@mirai-gikai/db/orm";
import {
  interview_messages,
  interview_rating_feedbacks,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";
import { syncInterviewOpinions as syncOpinions } from "@mirai-gikai/shared/interview-report/sync-opinions";
import type {
  InterviewMessage,
  InterviewOpinionInsert,
  InterviewReport,
  InterviewReportInsert,
  InterviewSession,
} from "../../shared/types";

// ========================================
// Interview Sessions
// ========================================

/** 指定の設定・ユーザーの、最新の未アーカイブセッションを引く条件 */
function latestNonArchivedWhere(interviewConfigId: string, userId: string) {
  return and(
    eq(interview_sessions.interview_config_id, interviewConfigId),
    eq(interview_sessions.user_id, userId),
    isNull(interview_sessions.archived_at)
  );
}

/**
 * アクティブ（未完了・未アーカイブ）なインタビューセッションを取得
 *
 * 判定対象は「最新の未アーカイブセッション」のみで、それが完了済みなら null を返す。
 * 完了済みセッションを飛び越えて古い未完了セッションを拾うと、LP の
 * findLatestNonArchivedSession（最新の未アーカイブセッション）による表示と食い違い、
 * 「もう一度新たに回答する」を押したのに過去の途中経過から再開されてしまう。
 */
export async function findActiveInterviewSession(
  interviewConfigId: string,
  userId: string
): Promise<InterviewSession | null> {
  const [row] = await createDb()
    .select()
    .from(interview_sessions)
    .where(latestNonArchivedWhere(interviewConfigId, userId))
    .orderBy(desc(interview_sessions.created_at))
    .limit(1);

  if (!row || row.completed_at !== null) {
    return null;
  }
  return row;
}

/**
 * セッションIDからインタビューセッション（interview_configs付き）を取得
 */
export async function findInterviewSessionWithConfigById(sessionId: string) {
  const row = await createDb().query.interview_sessions.findFirst({
    where: eq(interview_sessions.id, sessionId),
    with: { interview_configs: { columns: { bill_id: true } } },
  });
  if (!row) {
    throw new Error(`Interview session not found: ${sessionId}`);
  }
  return row;
}

/**
 * 最新の未アーカイブセッション（完了済みも含む）を取得
 */
export async function findLatestNonArchivedSession(
  interviewConfigId: string,
  userId: string
) {
  const row = await createDb().query.interview_sessions.findFirst({
    columns: { id: true, completed_at: true },
    where: latestNonArchivedWhere(interviewConfigId, userId),
    orderBy: desc(interview_sessions.created_at),
    with: { interview_report: { columns: { id: true } } },
  });
  return row ?? null;
}

/**
 * セッションの所有者情報（user_id）を取得
 */
export async function findSessionOwnerById(sessionId: string) {
  const [row] = await createDb()
    .select({ user_id: interview_sessions.user_id })
    .from(interview_sessions)
    .where(eq(interview_sessions.id, sessionId))
    .limit(1);
  if (!row) {
    throw new Error(`Interview session not found: ${sessionId}`);
  }
  return row;
}

/**
 * 新しいインタビューセッションを作成
 */
export async function createInterviewSessionRecord(params: {
  interviewConfigId: string;
  userId: string;
}): Promise<InterviewSession> {
  const [row] = await createDb()
    .insert(interview_sessions)
    .values({
      interview_config_id: params.interviewConfigId,
      user_id: params.userId,
      started_at: new Date().toISOString(),
    })
    .returning();
  return row;
}

/**
 * セッションをアーカイブ
 */
export async function updateInterviewSessionArchived(
  sessionId: string
): Promise<void> {
  await createDb()
    .update(interview_sessions)
    .set({ archived_at: new Date().toISOString() })
    .where(eq(interview_sessions.id, sessionId));
}

/**
 * セッションを完了
 */
export async function updateInterviewSessionCompleted(
  sessionId: string
): Promise<void> {
  await createDb()
    .update(interview_sessions)
    .set({ completed_at: new Date().toISOString() })
    .where(eq(interview_sessions.id, sessionId));
}

// ========================================
// Interview Messages
// ========================================

/**
 * セッションのメッセージを時系列順で取得
 */
export async function findInterviewMessagesBySessionId(
  sessionId: string
): Promise<InterviewMessage[]> {
  return createDb()
    .select()
    .from(interview_messages)
    .where(eq(interview_messages.interview_session_id, sessionId))
    .orderBy(asc(interview_messages.created_at), asc(interview_messages.id));
}

/**
 * セッションのメッセージを新しい順で取得
 */
export async function findInterviewMessagesBySessionIdDesc(
  sessionId: string
): Promise<InterviewMessage[]> {
  return createDb()
    .select()
    .from(interview_messages)
    .where(eq(interview_messages.interview_session_id, sessionId))
    .orderBy(desc(interview_messages.created_at), desc(interview_messages.id));
}

/**
 * インタビューメッセージを保存
 */
export async function createInterviewMessage(params: {
  sessionId: string;
  role: "assistant" | "user";
  content: string;
}): Promise<InterviewMessage> {
  const [row] = await createDb()
    .insert(interview_messages)
    .values({
      interview_session_id: params.sessionId,
      role: params.role,
      content: params.content,
    })
    .returning();
  return row;
}

// ========================================
// Interview Session Ratings
// ========================================

/**
 * セッションの星評価（1〜5）を保存（未評価のときだけ）
 */
export async function updateInterviewSessionRating(
  sessionId: string,
  rating: number
): Promise<void> {
  await createDb()
    .update(interview_sessions)
    .set({ rating })
    .where(
      and(
        eq(interview_sessions.id, sessionId),
        isNull(interview_sessions.rating)
      )
    );
}

/**
 * セッションの星評価を取得
 */
export async function findSessionRatingById(
  sessionId: string
): Promise<number | null> {
  const [row] = await createDb()
    .select({ rating: interview_sessions.rating })
    .from(interview_sessions)
    .where(eq(interview_sessions.id, sessionId))
    .limit(1);
  if (!row) {
    throw new Error(`Interview session not found: ${sessionId}`);
  }
  return row.rating;
}

// ========================================
// Interview Rating Feedbacks
// ========================================

/**
 * 低評価フィードバックタグを保存（複数タグ一括、冪等）
 */
export async function insertInterviewRatingFeedbacks(
  sessionId: string,
  tags: string[]
): Promise<void> {
  if (tags.length === 0) return;

  const uniqueTags = [...new Set(tags)];
  await createDb()
    .insert(interview_rating_feedbacks)
    .values(
      uniqueTags.map((tag) => ({
        interview_session_id: sessionId,
        tag: tag as Enums<"interview_feedback_tag_enum">,
      }))
    )
    .onConflictDoNothing({
      target: [
        interview_rating_feedbacks.interview_session_id,
        interview_rating_feedbacks.tag,
      ],
    });
}

// ========================================
// Interview Reports
// ========================================

/**
 * インタビューレポートをUPSERT
 */
export async function upsertInterviewReport(
  params: InterviewReportInsert
): Promise<InterviewReport> {
  const { interview_session_id: _, ...updates } = params;
  const [row] = await createDb()
    .insert(interview_report)
    .values(params)
    .onConflictDoUpdate({
      target: interview_report.interview_session_id,
      set: updates,
    })
    .returning();
  return row;
}

/**
 * レポートの意見を interview_opinion（正規化プロジェクション）へ同期する。
 * 実装は admin の再抽出と共通（@mirai-gikai/shared）。
 */
export async function syncInterviewOpinions(
  reportId: string,
  rows: InterviewOpinionInsert[]
): Promise<void> {
  await syncOpinions(reportId, rows);
}
