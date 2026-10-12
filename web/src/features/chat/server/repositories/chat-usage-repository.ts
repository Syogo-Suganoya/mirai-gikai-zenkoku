import "server-only";

import { createDb, type Database } from "@mirai-gikai/db";
import { and, eq, gte, lt, sql } from "@mirai-gikai/db/orm";
import { chat_usage_events } from "@mirai-gikai/db/schema";

type ChatUsageInsert =
  Database["public"]["Tables"]["chat_usage_events"]["Insert"];

type ChatUsageRow = Database["public"]["Tables"]["chat_usage_events"]["Row"];

export type { ChatUsageInsert, ChatUsageRow };

export async function insertChatUsageEvent(payload: ChatUsageInsert) {
  await createDb().insert(chat_usage_events).values(payload);
}

export async function findChatUsageEvents(
  userId: string,
  fromIso: string,
  toIso: string
): Promise<Pick<ChatUsageRow, "cost_usd" | "occurred_at">[]> {
  return createDb()
    .select({
      cost_usd: chat_usage_events.cost_usd,
      occurred_at: chat_usage_events.occurred_at,
    })
    .from(chat_usage_events)
    .where(
      and(
        eq(chat_usage_events.user_id, userId),
        gte(chat_usage_events.occurred_at, fromIso),
        lt(chat_usage_events.occurred_at, toIso)
      )
    );
}

export async function sumChatUsageCost(
  fromIso: string,
  toIso: string
): Promise<number> {
  const [row] = await createDb().execute<{ sum: string }>(
    sql`select sum_chat_usage_cost(${fromIso}::timestamptz, ${toIso}::timestamptz) as sum`
  );
  const sum = Number(row?.sum);
  return Number.isFinite(sum) ? sum : 0;
}
