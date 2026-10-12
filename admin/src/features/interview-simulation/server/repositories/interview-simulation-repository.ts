import "server-only";

import { createDb } from "@mirai-gikai/db";
import { eq } from "@mirai-gikai/db/orm";
import { interview_report } from "@mirai-gikai/db/schema";

/**
 * interview_report を id で 1 件取得する。
 * 既存の interview-report-repository は session_id ベースなので、
 * シミュレーション機能用にレポート ID 直接アクセスを提供する。
 */
export async function findInterviewReportById(reportId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_report)
    .where(eq(interview_report.id, reportId));
  return row ?? null;
}
