import "server-only";

import { createDb, queryRows, uuidArray } from "@mirai-gikai/db";
import { and, count, eq, sql } from "@mirai-gikai/db/orm";
import {
  interview_configs,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";

/**
 * 議案の公開レポート件数を数える（公開 = is_public_by_admin × is_public_by_user）。
 * 一覧の回答数バッジ、オープンデータAPIの配布下限判定などに使う共通関数。
 *
 * 公開の定義（管理者公開×ユーザー同意）を1箇所に持つため、各所がこれを共有する。
 */
export async function countPublicReportsByBillId(
  billId: string
): Promise<number> {
  const db = createDb();
  const [row] = await db
    .select({ count: count() })
    .from(interview_report)
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
        eq(interview_configs.bill_id, billId)
      )
    );

  return row?.count ?? 0;
}

/**
 * 複数議案の公開レポート件数をまとめて数える。
 *
 * 一覧で議案ごとにバッジを出すため、countPublicReportsByBillId を議案数ぶん
 * 呼ぶと数十回のクエリになる。集約はDB側（count_public_reports_by_bill_ids）で行う。
 *
 * 0件の議案は返り値に現れないので、呼び出し側で 0 として扱えるよう Map で返す。
 */
export async function countPublicReportsByBillIds(
  billIds: readonly string[]
): Promise<Map<string, number>> {
  if (billIds.length === 0) return new Map();

  const rows = await queryRows<{ bill_id: string; report_count: string }>(
    createDb(),
    sql`select * from count_public_reports_by_bill_ids(${uuidArray(billIds)})`
  );

  return new Map(rows.map((row) => [row.bill_id, Number(row.report_count)]));
}
