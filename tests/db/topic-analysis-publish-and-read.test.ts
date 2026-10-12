import { and, eq, inArray } from "@mirai-gikai/db/orm";
import {
  interview_configs,
  interview_opinion,
  interview_report,
  interview_sessions,
  topic_analysis_version,
} from "@mirai-gikai/db/schema";
import {
  buildPublicTopicAnalysis,
  findPublishedAnalysis,
} from "@mirai-gikai/topic-analysis-core/public-server";
import {
  createVersion,
  finalizeVersion,
  publishVersion,
  saveTopicsAndAssignments,
  setVersionPublished,
} from "@mirai-gikai/topic-analysis-core/repository";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createTestBill, createTestUser, db, type TestUser } from "./utils";

/** session + report + interview_opinion を作り、opinionId を返す。 */
async function createReportWithOpinions(opts: {
  configId: string;
  userId: string;
  isPublicByUser: boolean;
  isPublicByAdmin?: boolean;
  moderationScore: number;
  role?: string;
  opinions: Array<{ title: string; content: string; bill_sentiment?: string }>;
}): Promise<string[]> {
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
      role: opts.role ?? "general_citizen",
      summary: "s",
    })
    .returning();
  if (!report) throw new Error("report insert failed");

  const ops = await db
    .insert(interview_opinion)
    .values(
      opts.opinions.map((o, i) => ({
        interview_report_id: report.id,
        opinion_index: i,
        title: o.title,
        content: o.content,
        bill_sentiment: o.bill_sentiment ?? null,
      }))
    )
    .returning();
  if (!ops) throw new Error("opinion insert failed");
  return ops.map((o) => o.id);
}

async function createCompletedVersion(billId: string): Promise<string> {
  const v = await createVersion(billId, "manual", "m", "v1");
  if (!v) throw new Error("version create returned null");
  await finalizeVersion(v.id, 0);
  return v.id;
}

describe("publish / 公開読み取り 統合テスト", () => {
  let testUser: TestUser;
  let billId: string;
  let configId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill();
    billId = bill.id;
    const [config] = await db
      .insert(interview_configs)
      .values({ bill_id: billId, status: "public", name: "uta-pub-test" })
      .returning();
    if (!config) throw new Error("config insert failed");
    configId = config.id;
  });

  afterEach(async () => {
    // active(pending/running) を終端し、公開も全解除して次テストへ干渉させない
    await db
      .update(topic_analysis_version)
      .set({ status: "failed", is_published: false })
      .where(
        and(
          eq(topic_analysis_version.bill_id, billId),
          inArray(topic_analysis_version.status, ["pending", "running"])
        )
      );
    await db
      .update(topic_analysis_version)
      .set({ is_published: false })
      .where(eq(topic_analysis_version.bill_id, billId));
  });

  it("publishVersion は bill 内で公開を1版に保つ（旧版を降ろす）", async () => {
    const v1 = await createCompletedVersion(billId);
    await publishVersion(v1);
    const v2 = await createCompletedVersion(billId);
    await publishVersion(v2);

    const rows = await db
      .select()
      .from(topic_analysis_version)
      .where(eq(topic_analysis_version.bill_id, billId));
    const published = (rows ?? []).filter((r) => r.is_published);
    expect(published).toHaveLength(1);
    expect(published[0].id).toBe(v2);
  });

  it("setVersionPublished(false) で全非公開にできる", async () => {
    const v1 = await createCompletedVersion(billId);
    await publishVersion(v1);
    await setVersionPublished(v1, false);
    const rows = await db
      .select()
      .from(topic_analysis_version)
      .where(eq(topic_analysis_version.bill_id, billId));
    expect((rows ?? []).some((r) => r.is_published)).toBe(false);
  });

  it("公開版が無ければ findPublishedAnalysis は null", async () => {
    await createCompletedVersion(billId);
    expect(await findPublishedAnalysis(billId)).toBeNull();
  });

  it("公開読み取りは §8（管理者公開×公開同意×モデOK）の意見だけ返し件数も再計算", async () => {
    // 管理者公開×公開同意×OK の意見1、ユーザー非公開1、管理者非公開1
    const okIds = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      isPublicByAdmin: true,
      moderationScore: 5,
      role: "daily_life_affected",
      opinions: [{ title: "ok", content: "c", bill_sentiment: "期待" }],
    });
    const privateIds = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: false,
      moderationScore: 5,
      opinions: [{ title: "private", content: "c" }],
    });
    const adminNgIds = await createReportWithOpinions({
      configId,
      userId: testUser.id,
      isPublicByUser: true,
      isPublicByAdmin: false,
      moderationScore: 5,
      opinions: [{ title: "admin-ng", content: "c" }],
    });

    const versionId = await createCompletedVersion(billId);
    await saveTopicsAndAssignments(
      versionId,
      [
        {
          title: "論点A",
          description: "desc",
          sort_order: 0,
          parent_sort_order: null,
        },
      ],
      [
        { opinion_id: okIds[0], topic_index: 0 },
        { opinion_id: privateIds[0], topic_index: 0 },
        { opinion_id: adminNgIds[0], topic_index: 0 },
      ]
    );
    await publishVersion(versionId);

    const data = await findPublishedAnalysis(billId);
    expect(data).not.toBeNull();
    if (!data) return;
    const result = buildPublicTopicAnalysis(data.meta, data.rawTopics);

    expect(result.total_opinions).toBe(1);
    expect(result.topics).toHaveLength(1);
    expect(result.topics[0].opinion_count).toBe(1);
    expect(result.topics[0].affected_count).toBe(1);
    expect(result.topics[0].sentiment).toEqual({ 期待: 1, 懸念: 0 });
    expect(result.topics[0].opinions[0].title).toBe("ok");
  });
});
