import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, asc, desc, eq, isNull } from "@mirai-gikai/db/orm";
import { interview_configs, interview_questions } from "@mirai-gikai/db/schema";

/**
 * bill_idから公開ステータスのインタビュー設定を取得（なければ null）
 */
export async function findPublicInterviewConfigByBillId(billId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_configs)
    .where(
      and(
        eq(interview_configs.bill_id, billId),
        eq(interview_configs.status, "public"),
        isNull(interview_configs.deleted_at)
      )
    )
    .limit(1);
  return row ?? null;
}

/**
 * bill_idから最新のインタビュー設定を取得（ステータス問わず。なければ null）
 */
export async function findLatestInterviewConfigByBillId(billId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_configs)
    .where(
      and(
        eq(interview_configs.bill_id, billId),
        isNull(interview_configs.deleted_at)
      )
    )
    .orderBy(desc(interview_configs.updated_at))
    .limit(1);
  return row ?? null;
}

/**
 * interview_config_idからインタビュー質問一覧を取得（question_order昇順）
 */
export async function findInterviewQuestionsByConfigId(
  interviewConfigId: string
) {
  return createDb()
    .select()
    .from(interview_questions)
    .where(eq(interview_questions.interview_config_id, interviewConfigId))
    .orderBy(asc(interview_questions.question_order));
}
