import {
  interview_configs,
  interview_opinion,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";
import { fetchTargetOpinions } from "@mirai-gikai/topic-analysis-core/repository";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  db,
  type TestUser,
} from "./utils";

// Supabase/PostgREST の既定行数上限（1000）を超えても全件取得できることを検証する。
const OPINION_COUNT = 1001;

let user: TestUser;
let billId: string;

describe("fetchTargetOpinions ページネーション統合テスト", () => {
  beforeAll(async () => {
    user = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;

    const [config] = await db
      .insert(interview_configs)
      .values({ bill_id: billId, status: "public", name: "fetch-page-test" })
      .returning();
    if (!config) throw new Error("config insert failed");

    const [session] = await db
      .insert(interview_sessions)
      .values({
        interview_config_id: config.id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .returning();
    if (!session) throw new Error("session insert failed");

    // §8 フィルタ（管理者公開・ユーザー公開・モデレーションOK）を通すレポート。
    const [report] = await db
      .insert(interview_report)
      .values({
        interview_session_id: session.id,
        is_public_by_user: true,
        is_public_by_admin: true,
        moderation_score: 5,
        role: "general_citizen",
        summary: "s",
      })
      .returning();
    if (!report) throw new Error("report insert failed");

    const rows = Array.from({ length: OPINION_COUNT }, (_, i) => ({
      interview_report_id: report.id,
      opinion_index: i,
      title: `意見${i}`,
      content: `内容${i}`,
    }));
    await db.insert(interview_opinion).values(rows);
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(user.id);
  });

  it("対象意見が1000件を超えても全件取得する（既定上限で切れない）", async () => {
    const opinions = await fetchTargetOpinions(billId);
    expect(opinions.length).toBe(OPINION_COUNT);
    // opinion_index の取りこぼし・重複が無いこと（0..OPINION_COUNT-1 が一意に揃う）。
    const indices = new Set(opinions.map((o) => o.opinion_index));
    expect(indices.size).toBe(OPINION_COUNT);
  });
});
