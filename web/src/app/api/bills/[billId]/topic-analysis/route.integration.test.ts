import {
  interview_configs,
  interview_opinion,
  interview_report,
  interview_sessions,
  topic,
  topic_analysis_version,
  topic_opinion,
} from "@mirai-gikai/db/schema";
import {
  buildPublicTopicAnalysis,
  findPublishedAnalysis,
} from "@mirai-gikai/topic-analysis-core/public-server";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  db,
  type TestUser,
} from "@test-utils/utils";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET } from "./route";

/** report + interview_opinion を1件作り、opinionId を返す。 */
async function createOpinion(opts: {
  configId: string;
  userId: string;
  isPublicByUser: boolean;
  isPublicByAdmin?: boolean;
  moderationScore: number;
  role:
    | "daily_life_affected"
    | "work_related"
    | "subject_expert"
    | "general_citizen";
  title: string;
  billSentiment?: string;
}): Promise<string> {
  const [session] = await db
    .insert(interview_sessions)
    .values({
      interview_config_id: opts.configId,
      user_id: opts.userId,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .returning();
  if (!session) throw new Error("session insert failed");

  const [report] = await db
    .insert(interview_report)
    .values({
      interview_session_id: session.id,
      is_public_by_user: opts.isPublicByUser,
      is_public_by_admin: opts.isPublicByAdmin ?? true,
      moderation_score: opts.moderationScore,
      role: opts.role,
      summary: "s",
    })
    .returning();
  if (!report) throw new Error("report insert failed");

  const [opinion] = await db
    .insert(interview_opinion)
    .values({
      interview_report_id: report.id,
      opinion_index: 0,
      title: opts.title,
      content: "c",
      bill_sentiment: opts.billSentiment ?? null,
    })
    .returning();
  if (!opinion) throw new Error("opinion insert failed");
  return opinion.id;
}

describe("公開トピック分析 読み取り（web 統合）", () => {
  let testUser: TestUser;
  let billId: string;
  let publishedBillId: string;

  beforeAll(async () => {
    testUser = await createTestUser();

    // 公開版あり: topic に「公開×OK」「非公開」の2意見を割当
    const bill = await createTestBill();
    publishedBillId = bill.id;
    const [config] = await db
      .insert(interview_configs)
      .values({
        bill_id: publishedBillId,
        status: "public",
        name: "uta-read-test",
      })
      .returning();
    if (!config) throw new Error("config insert failed");

    const okId = await createOpinion({
      configId: config.id,
      userId: testUser.id,
      isPublicByUser: true,
      moderationScore: 5,
      role: "daily_life_affected",
      title: "公開OK",
      billSentiment: "期待",
    });
    const privateId = await createOpinion({
      configId: config.id,
      userId: testUser.id,
      isPublicByUser: false,
      moderationScore: 5,
      role: "general_citizen",
      title: "非公開",
    });

    const [version] = await db
      .insert(topic_analysis_version)
      .values({
        bill_id: publishedBillId,
        version: 1,
        status: "completed",
        trigger: "manual",
        is_published: true,
        completed_at: new Date().toISOString(),
      })
      .returning();
    if (!version) throw new Error("version insert failed");

    const [topicRow] = await db
      .insert(topic)
      .values({
        version_id: version.id,
        title: "論点A",
        description: "desc",
        sort_order: 0,
      })
      .returning();
    if (!topicRow) throw new Error("topic insert failed");

    await db.insert(topic_opinion).values([
      { version_id: version.id, topic_id: topicRow.id, opinion_id: okId },
      { version_id: version.id, topic_id: topicRow.id, opinion_id: privateId },
    ]);

    // 公開版なしの bill
    const bill2 = await createTestBill();
    billId = bill2.id;
  });

  afterAll(async () => {
    // beforeAll が途中失敗した場合に未初期化値で二次エラーを起こし、
    // 元の失敗原因を隠さないよう存在チェックしてからクリーンアップする。
    if (publishedBillId) await cleanupTestBill(publishedBillId);
    if (billId) await cleanupTestBill(billId);
    if (testUser?.id) await cleanupTestUser(testUser.id);
  });

  it("findPublishedAnalysis + buildPublicTopicAnalysis が公開フィルタ後を返す", async () => {
    const data = await findPublishedAnalysis(publishedBillId);
    expect(data).not.toBeNull();
    if (!data) return;
    const result = buildPublicTopicAnalysis(data.meta, data.rawTopics);
    expect(result.total_opinions).toBe(1);
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0].opinions[0].title).toBe("公開OK");
    expect(result.topics[0].affected_count).toBe(1);
    expect(result.topics[0].sentiment).toEqual({ 期待: 1, 懸念: 0 });
  });

  it("公開版が無ければ null", async () => {
    expect(await findPublishedAnalysis(billId)).toBeNull();
  });

  it("GET は公開版を 200 で返す", async () => {
    const res = await GET(
      new Request("http://localhost/api/bills/x/topic-analysis"),
      { params: Promise.resolve({ billId: publishedBillId }) }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total_opinions: number };
    expect(body.total_opinions).toBe(1);
  });

  it("GET は公開版が無ければ 404", async () => {
    const res = await GET(
      new Request("http://localhost/api/bills/x/topic-analysis"),
      { params: Promise.resolve({ billId }) }
    );
    expect(res.status).toBe(404);
  });
});
