import { eq } from "@mirai-gikai/db/orm";
import { chat_usage_events } from "@mirai-gikai/db/schema";
import {
  cleanupTestUser,
  createTestUser,
  db,
  type TestUser,
} from "@test-utils/utils";
import type { LanguageModelUsage } from "ai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getUsageCostUsd, recordChatUsage } from "./cost-tracker";

function mockUsage(
  input: number,
  output: number,
  total: number
): LanguageModelUsage {
  return {
    inputTokens: input,
    outputTokens: output,
    totalTokens: total,
  } as LanguageModelUsage;
}

describe("cost-tracker 統合テスト", () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    // テストデータを削除
    await db
      .delete(chat_usage_events)
      .where(eq(chat_usage_events.user_id, testUser.id));
    await cleanupTestUser(testUser.id);
  });

  describe("recordChatUsage", () => {
    it("usage を DB に記録できる", async () => {
      await recordChatUsage({
        userId: testUser.id,
        model: "gemini-3.8-flash",
        usage: mockUsage(500, 100, 600),
      });

      // DB 状態を検証
      const data = await db
        .select()
        .from(chat_usage_events)
        .where(eq(chat_usage_events.user_id, testUser.id));

      expect(data).toHaveLength(1);
      expect(data[0].model).toBe("gemini-3.8-flash");
      expect(data[0].input_tokens).toBe(500);
      expect(data[0].output_tokens).toBe(100);
      expect(data[0].total_tokens).toBe(600);
      expect(Number(data[0].cost_usd)).toBeGreaterThan(0);
    });

    it("costUsd が指定された場合はそれを使う", async () => {
      await recordChatUsage({
        userId: testUser.id,
        model: "gemini-3.8-flash",
        usage: mockUsage(500, 100, 600),
        costUsd: 0.05,
      });

      const [data] = await db
        .select({ cost_usd: chat_usage_events.cost_usd })
        .from(chat_usage_events)
        .where(eq(chat_usage_events.user_id, testUser.id));

      expect(Number(data.cost_usd)).toBeCloseTo(0.05);
    });

    it("sessionId と metadata を記録できる", async () => {
      await recordChatUsage({
        userId: testUser.id,
        model: "gemini-3.8-flash",
        sessionId: "test-session-123",
        promptName: "bill-chat-system-normal",
        usage: mockUsage(100, 50, 150),
        metadata: { pageType: "bill", difficultyLevel: "normal" },
      });

      const [data] = await db
        .select({
          session_id: chat_usage_events.session_id,
          prompt_name: chat_usage_events.prompt_name,
          metadata: chat_usage_events.metadata,
        })
        .from(chat_usage_events)
        .where(eq(chat_usage_events.user_id, testUser.id));

      expect(data.session_id).toBe("test-session-123");
      expect(data.prompt_name).toBe("bill-chat-system-normal");
      // biome-ignore lint/suspicious/noExplicitAny: metadata は JSON 型
      expect((data.metadata as any).pageType).toBe("bill");
    });
  });

  describe("getUsageCostUsd", () => {
    it("期間内の合計コストを返す", async () => {
      const now = new Date();
      const from = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      // 2 レコード挿入
      await recordChatUsage({
        userId: testUser.id,
        model: "gemini-3.8-flash",
        usage: mockUsage(1000, 500, 1500),
        costUsd: 0.01,
      });
      await recordChatUsage({
        userId: testUser.id,
        model: "gemini-3.8-flash",
        usage: mockUsage(2000, 1000, 3000),
        costUsd: 0.02,
      });

      const totalCost = await getUsageCostUsd(testUser.id, from, to);
      expect(totalCost).toBeCloseTo(0.03);
    });

    it("レコードがない場合は 0 を返す", async () => {
      const now = new Date();
      const from = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

      const totalCost = await getUsageCostUsd(testUser.id, from, to);
      expect(totalCost).toBe(0);
    });
  });
});
