import { eq, sql } from "@mirai-gikai/db/orm";
import { chat_usage_events } from "@mirai-gikai/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestUser,
  createTestUser,
  db,
  scalar,
  type TestUser,
} from "../utils";

function sumCost(from: string, to: string) {
  return scalar<string>(
    sql`sum_chat_usage_cost(${from}::timestamptz, ${to}::timestamptz)`
  );
}

describe("sum_chat_usage_cost", () => {
  let testUser: TestUser;

  beforeAll(async () => {
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await db
      .delete(chat_usage_events)
      .where(eq(chat_usage_events.user_id, testUser.id));
    await cleanupTestUser(testUser.id);
  });

  it("指定期間のcost_usdの合計を返す", async () => {
    await db.insert(chat_usage_events).values([
      {
        user_id: testUser.id,
        model: "gemini-flash",
        cost_usd: "0.01",
        occurred_at: "2025-06-15T10:00:00Z",
      },
      {
        user_id: testUser.id,
        model: "gemini-flash",
        cost_usd: "0.02",
        occurred_at: "2025-06-15T11:00:00Z",
      },
      {
        user_id: testUser.id,
        model: "gemini-flash",
        cost_usd: "0.05",
        occurred_at: "2025-06-16T10:00:00Z",
      },
    ]);

    const total = await sumCost("2025-06-15T00:00:00Z", "2025-06-16T00:00:00Z");
    expect(Number(total)).toBeCloseTo(0.03, 6);
  });

  it("該当データがない場合は0を返す", async () => {
    const total = await sumCost("2099-01-01T00:00:00Z", "2099-01-02T00:00:00Z");
    expect(Number(total)).toBe(0);
  });
});
