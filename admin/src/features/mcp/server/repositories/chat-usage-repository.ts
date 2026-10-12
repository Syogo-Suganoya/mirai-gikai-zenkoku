import "server-only";

import { createDb, queryRows } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";

type ChatUsageMetricRow = {
  prompt_name: string;
  event_count: string | number;
  unique_user_count: string | number;
  unique_session_count: string | number;
  total_tokens: string | number;
  total_cost_usd: string | number;
};

export async function findChatUsageMetrics(params: {
  from?: string;
  to?: string;
  billId?: string;
}) {
  const rows = await queryRows<ChatUsageMetricRow>(
    createDb(),
    sql`select * from get_chat_usage_metrics(
      ${params.from ?? null}::timestamptz,
      ${params.to ?? null}::timestamptz,
      ${params.billId ?? null}::uuid
    )`
  );
  // bigint・numeric は文字列で返るので数値にそろえる
  return rows.map((row) => ({
    prompt_name: row.prompt_name,
    event_count: Number(row.event_count),
    unique_user_count: Number(row.unique_user_count),
    unique_session_count: Number(row.unique_session_count),
    total_tokens: Number(row.total_tokens),
    total_cost_usd: Number(row.total_cost_usd),
  }));
}
