import { asc, eq } from "@mirai-gikai/db/orm";
import {
  interview_configs,
  interview_messages,
  interview_opinion,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";
import {
  findReportsToTag,
  findUntaggedOpinions,
} from "@mirai-gikai/topic-analysis-core/repository";
import { extractOpinionTagsForReport } from "@mirai-gikai/topic-analysis-core/tag-backfill-service";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  db,
  type TestUser,
} from "./utils";

/**
 * タグ付けサービスの統合テスト（LLM だけ Fake に差し替える）。
 *
 * このPRの核心である「タグは書くが、返ってこなかった意見はウォーターマークだけ進める」
 * 「1件も返らなければ failed として集計に出す」を回帰検知する。
 */

async function createReportWithOpinions(opts: {
  configId: string;
  userId: string;
  opinionCount: number;
  withMessages: boolean;
}) {
  const [session] = await db
    .insert(interview_sessions)
    .values({
      interview_config_id: opts.configId,
      user_id: opts.userId,
      started_at: "2024-07-01T00:00:00Z",
      completed_at: "2024-07-01T00:00:00Z",
    })
    .returning();
  if (!session) throw new Error("session 作成失敗");

  const [report] = await db
    .insert(interview_report)
    .values({
      interview_session_id: session.id,
      is_public_by_user: true,
      summary: "サマリ",
      stance: "for",
      role: "work_related",
      role_title: "教員",
      opinions: [] as never,
      created_at: "2024-07-01T00:00:00Z",
    })
    .returning();
  if (!report) throw new Error("report 作成失敗");

  if (opts.withMessages) {
    await db.insert(interview_messages).values([
      {
        interview_session_id: session.id,
        role: "assistant",
        content: JSON.stringify({ text: "どう思いますか？" }),
      },
      {
        interview_session_id: session.id,
        role: "user",
        content: "現場では紙のほうが定着すると感じます",
      },
    ]);
  }

  await db.insert(interview_opinion).values(
    Array.from({ length: opts.opinionCount }, (_, i) => ({
      interview_report_id: report.id,
      opinion_index: i,
      title: `意見${i}`,
      content: `内容${i}`,
    }))
  );

  return { reportId: report.id, sessionId: session.id };
}

async function readOpinions(reportId: string) {
  const data = await db
    .select()
    .from(interview_opinion)
    .where(eq(interview_opinion.interview_report_id, reportId))
    .orderBy(asc(interview_opinion.opinion_index));
  return data ?? [];
}

describe("extractOpinionTagsForReport 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;
    const [config] = await db
      .insert(interview_configs)
      .values({ bill_id: billId, status: "public", name: "tag-service-test" })
      .returning();
    if (!config) throw new Error("config 作成失敗");
    configId = config.id;
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("返ってきた意見にはタグを書き、返らなかった意見はウォーターマークだけ進める", async () => {
    const { reportId, sessionId } = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      opinionCount: 2,
      withMessages: true,
    });

    const result = await extractOpinionTagsForReport(
      { reportId, sessionId, role: "work_related", roleTitle: "教員" },
      {
        // index 0 だけ返し、index 1 は返さない
        generateTags: async () => ({
          tags: [
            {
              opinion_index: 0,
              concern: "健康影響が心配",
              proposal: null,
              reasoning_types: ["professional_expertise" as const],
            },
          ],
        }),
      }
    );

    expect(result.status).toBe("updated");
    expect(result.tagged).toBe(1);

    const opinions = await readOpinions(reportId);
    expect(opinions[0].concern).toBe("健康影響が心配");
    expect(opinions[0].reasoning_types).toEqual(["professional_expertise"]);
    expect(opinions[0].tags_extracted_at).not.toBeNull();

    // 返ってこなかった意見: タグは空のまま、ウォーターマークだけ進む
    expect(opinions[1].concern).toBeNull();
    expect(opinions[1].reasoning_types).toEqual([]);
    expect(opinions[1].tags_extracted_at).not.toBeNull();

    // 二度と対象にならない
    expect(await findUntaggedOpinions(reportId)).toEqual([]);
  });

  // 全件空振りを updated として集計すると「正常完了」に見えてしまう。
  it("1件もタグが返らなければ failed になる", async () => {
    const { reportId, sessionId } = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      opinionCount: 1,
      withMessages: true,
    });

    const result = await extractOpinionTagsForReport(
      { reportId, sessionId, role: null, roleTitle: null },
      { generateTags: async () => ({ tags: [] }) }
    );

    expect(result.status).toBe("failed");
    expect(result.tagged).toBe(0);
  });

  // 発言原文が無いと professional_expertise の判定材料が無い。
  it("会話ログが無いレポートは skip する", async () => {
    const { reportId, sessionId } = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      opinionCount: 1,
      withMessages: false,
    });

    let called = false;
    const result = await extractOpinionTagsForReport(
      { reportId, sessionId, role: null, roleTitle: null },
      {
        generateTags: async () => {
          called = true;
          return { tags: [] };
        },
      }
    );

    expect(result.status).toBe("skipped");
    expect(result.reason).toBe("no chat messages");
    expect(called).toBe(false);
    // 滞留しないようウォーターマークは進む
    expect(await findUntaggedOpinions(reportId)).toEqual([]);
  });

  it("タグ付け済みのレポートは対象抽出に出てこない", async () => {
    const { reportId, sessionId } = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      opinionCount: 1,
      withMessages: true,
    });
    await extractOpinionTagsForReport(
      { reportId, sessionId, role: null, roleTitle: null },
      {
        generateTags: async () => ({
          tags: [
            {
              opinion_index: 0,
              concern: null,
              proposal: null,
              reasoning_types: ["none" as const],
            },
          ],
        }),
      }
    );

    const remaining = await findReportsToTag(50, billId);
    expect(remaining.map((r) => r.reportId)).not.toContain(reportId);
  });
});
