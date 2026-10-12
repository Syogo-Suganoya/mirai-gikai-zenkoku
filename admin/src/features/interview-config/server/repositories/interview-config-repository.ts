import "server-only";

import { createDb, queryRows, uuidArray } from "@mirai-gikai/db";
import { and, asc, desc, eq, isNull, ne, sql } from "@mirai-gikai/db/orm";
import {
  bills,
  interview_configs,
  interview_questions,
} from "@mirai-gikai/db/schema";
import type { PromptOverridesByMode } from "@mirai-gikai/shared/interview-prompts/sections";
import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";
import type { InterviewConfig, InterviewQuestion } from "../../shared/types";

export type InterviewConfigWithBill = InterviewConfig & {
  bill: { id: string; name: string };
};

export async function findAllInterviewConfigs(): Promise<
  InterviewConfigWithBill[]
> {
  const rows = await createDb()
    .select({
      config: interview_configs,
      bill: { id: bills.id, name: bills.name },
    })
    .from(interview_configs)
    .innerJoin(bills, eq(bills.id, interview_configs.bill_id))
    .where(isNull(interview_configs.deleted_at))
    .orderBy(desc(interview_configs.created_at));

  return rows.map((row) => ({ ...row.config, bill: row.bill }));
}

export async function findInterviewConfigsByBillId(
  billId: string
): Promise<InterviewConfig[]> {
  return createDb()
    .select()
    .from(interview_configs)
    .where(
      and(
        eq(interview_configs.bill_id, billId),
        isNull(interview_configs.deleted_at)
      )
    )
    .orderBy(desc(interview_configs.created_at));
}

export async function findInterviewConfigById(
  configId: string
): Promise<InterviewConfig | null> {
  const [row] = await createDb()
    .select()
    .from(interview_configs)
    .where(eq(interview_configs.id, configId));
  return row ?? null;
}

export async function findInterviewConfigBillId(
  configId: string
): Promise<{ bill_id: string }> {
  const [row] = await createDb()
    .select({ bill_id: interview_configs.bill_id })
    .from(interview_configs)
    .where(eq(interview_configs.id, configId));
  if (!row) {
    throw new Error("Failed to fetch interview config: not found");
  }
  return row;
}

export async function findInterviewQuestionsByConfigId(
  interviewConfigId: string
): Promise<InterviewQuestion[]> {
  return createDb()
    .select()
    .from(interview_questions)
    .where(eq(interview_questions.interview_config_id, interviewConfigId))
    .orderBy(asc(interview_questions.question_order));
}

export async function closeOtherPublicConfigs(
  billId: string,
  excludeConfigId?: string
): Promise<void> {
  await createDb()
    .update(interview_configs)
    .set({ status: "closed", updated_at: sql`now()` })
    .where(
      and(
        eq(interview_configs.bill_id, billId),
        eq(interview_configs.status, "public"),
        excludeConfigId ? ne(interview_configs.id, excludeConfigId) : undefined
      )
    );
}

export async function createInterviewConfigRecord(params: {
  bill_id: string;
  name: string;
  status: "public" | "closed";
  mode: InterviewMode;
  themes: string[] | null;
  chat_model: string | null;
  estimated_duration: number | null;
  prompt_overrides: PromptOverridesByMode | null;
}): Promise<{ id: string }> {
  const [row] = await createDb()
    .insert(interview_configs)
    .values(params)
    .returning({ id: interview_configs.id });
  return row;
}

export async function updateInterviewConfigRecord(
  configId: string,
  params: {
    name: string;
    status: "public" | "closed";
    mode: InterviewMode;
    themes: string[] | null;
    chat_model: string | null;
    estimated_duration: number | null;
    /** 未指定なら既存の値を残す。 */
    prompt_overrides?: PromptOverridesByMode | null;
    updated_at: string;
  }
): Promise<{ id: string }> {
  const [row] = await createDb()
    .update(interview_configs)
    .set(params)
    .where(eq(interview_configs.id, configId))
    .returning({ id: interview_configs.id });
  if (!row) {
    throw new Error("Failed to update interview config: not found");
  }
  return row;
}

export async function countSessionsByConfigIds(
  configIds: string[]
): Promise<Record<string, number>> {
  if (configIds.length === 0) return {};

  const rows = await queryRows<{
    interview_config_id: string;
    session_count: string | number;
  }>(
    createDb(),
    sql`select * from count_sessions_by_config_ids(${uuidArray(configIds)})`
  );

  const result: Record<string, number> = {};
  for (const configId of configIds) {
    result[configId] = 0;
  }
  for (const row of rows) {
    result[row.interview_config_id] = Number(row.session_count);
  }
  return result;
}

/**
 * インタビュー設定を物理削除する
 * 複製時のロールバックなど、作成直後のレコードを完全に取り消す用途で使用する
 */
export async function deleteInterviewConfigRecord(
  configId: string
): Promise<void> {
  await createDb()
    .delete(interview_configs)
    .where(eq(interview_configs.id, configId));
}

/**
 * インタビュー設定を論理削除する（deleted_atを設定）
 * 紐づく質問・セッション・レポートは保持され、一覧・公開取得から除外される。
 * 同時に status を closed にし、status="public" を見る公開判定
 * （議案一覧の「AIインタビュー受付中」バッジ等）からも除外されるようにする。
 */
export async function softDeleteInterviewConfigRecord(
  configId: string
): Promise<void> {
  await createDb()
    .update(interview_configs)
    .set({ deleted_at: sql`now()`, status: "closed", updated_at: sql`now()` })
    .where(
      and(
        eq(interview_configs.id, configId),
        isNull(interview_configs.deleted_at)
      )
    );
}

/**
 * 論理削除した設定に紐づくレポートを公開停止する（is_public_by_admin=false）。
 * 公開レポートの全取得経路（個別ページ・公開一覧・各 DB function）が
 * is_public_by_admin=true でゲートしているため、これにより一括で公開対象から除外される。
 */
export async function unpublishReportsByConfigId(
  configId: string
): Promise<void> {
  await createDb().execute(
    sql`select unpublish_reports_by_config_id(${configId}::uuid)`
  );
}

export async function createInterviewQuestions(
  questions: {
    interview_config_id: string;
    question: string;
    follow_up_guide: string | null;
    quick_replies: string[] | null;
    question_order: number;
  }[]
): Promise<void> {
  if (questions.length === 0) return;
  await createDb().insert(interview_questions).values(questions);
}

export async function deleteInterviewQuestionsByConfigId(
  interviewConfigId: string
): Promise<void> {
  await createDb()
    .delete(interview_questions)
    .where(eq(interview_questions.interview_config_id, interviewConfigId));
}
