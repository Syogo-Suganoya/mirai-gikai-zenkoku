import { eq, sql } from "@mirai-gikai/db/orm";
import { interview_report } from "@mirai-gikai/db/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestInterviewConfig,
  createTestInterviewReport as createTestReport,
  createTestInterviewSession as createTestSession,
  createTestUser,
  db,
  scalar,
  type TestUser,
} from "../utils";

type BulkParams = {
  p_config_id: string;
  p_max_moderation_score: number;
  p_min_content_richness: number;
};

async function callBulk(
  fn: "count_bulk_publish_targets" | "bulk_publish_reports",
  params: BulkParams
): Promise<number> {
  const value = await scalar<string>(
    sql`${sql.raw(fn)}(${params.p_config_id}::uuid, ${params.p_max_moderation_score}::int, ${params.p_min_content_richness}::int)`
  );
  return Number(value);
}

async function isPublicByAdmin(reportId: string) {
  const [row] = await db
    .select({ is_public_by_admin: interview_report.is_public_by_admin })
    .from(interview_report)
    .where(eq(interview_report.id, reportId));
  return row.is_public_by_admin;
}

describe("count_bulk_publish_targets / bulk_publish_reports", () => {
  let testUser: TestUser;
  const billIds: string[] = [];

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    await cleanupTestUser(testUser.id);
  });

  it("条件に合致するレポートのみカウントされる", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 対象: is_public_by_user=true, is_public_by_admin=false, moderation_score<=29, total_content_richness>=50
    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 20,
      content_richness: { total: 60 },
    });

    // 対象外: is_public_by_user=false
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: false,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 70 },
    });

    // 対象外: moderation_score > 29
    const s3 = await createTestSession(config.id, testUser.id);
    await createTestReport(s3.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 50,
      content_richness: { total: 80 },
    });

    // 対象外: total_content_richness < 50
    const s4 = await createTestSession(config.id, testUser.id);
    await createTestReport(s4.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 30 },
    });

    // 対象外: is_public_by_admin=true（既に公開済み）
    const s5 = await createTestSession(config.id, testUser.id);
    await createTestReport(s5.id, {
      is_public_by_user: true,
      is_public_by_admin: true,
      moderation_score: 10,
      content_richness: { total: 60 },
    });

    const data = await callBulk("count_bulk_publish_targets", {
      p_config_id: config.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });

    expect(data).toBe(1);
  });

  it("moderation_scoreやtotal_content_richnessがNULLのレポートは除外される", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // moderation_score が NULL
    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      content_richness: { total: 60 },
    });

    // content_richness が NULL（total_content_richness も NULL）
    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
    });

    const data = await callBulk("count_bulk_publish_targets", {
      p_config_id: config.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });

    expect(data).toBe(0);
  });

  it("別configのレポートはカウントされない", async () => {
    const bill1 = await createTestBill();
    const bill2 = await createTestBill();
    billIds.push(bill1.id, bill2.id);
    const config1 = await createTestInterviewConfig(bill1.id);
    const config2 = await createTestInterviewConfig(bill2.id);

    // config1 のレポート（対象）
    const s1 = await createTestSession(config1.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 60 },
    });

    // config2 のレポート（別configなので対象外）
    const s2 = await createTestSession(config2.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 60 },
    });

    const data = await callBulk("count_bulk_publish_targets", {
      p_config_id: config1.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });

    expect(data).toBe(1);
  });

  it("bulk_publish_reportsが対象レポートのみ更新し件数を返す", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    // 対象レポート2件
    const s1 = await createTestSession(config.id, testUser.id);
    const r1 = await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 20,
      content_richness: { total: 60 },
    });

    const s2 = await createTestSession(config.id, testUser.id);
    const r2 = await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 10,
      content_richness: { total: 80 },
    });

    // 対象外レポート
    const s3 = await createTestSession(config.id, testUser.id);
    const r3 = await createTestReport(s3.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 50,
      content_richness: { total: 80 },
    });

    const data = await callBulk("bulk_publish_reports", {
      p_config_id: config.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    });

    expect(data).toBe(2);

    // 対象レポートが公開されていることを確認
    expect(await isPublicByAdmin(r1.id)).toBe(true);

    expect(await isPublicByAdmin(r2.id)).toBe(true);

    // 対象外レポートは変更されていないことを確認
    expect(await isPublicByAdmin(r3.id)).toBe(false);
  });

  it("countとbulkPublishの件数が一致する", async () => {
    const bill = await createTestBill();
    billIds.push(bill.id);
    const config = await createTestInterviewConfig(bill.id);

    const s1 = await createTestSession(config.id, testUser.id);
    await createTestReport(s1.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 15,
      content_richness: { total: 70 },
    });

    const s2 = await createTestSession(config.id, testUser.id);
    await createTestReport(s2.id, {
      is_public_by_user: true,
      is_public_by_admin: false,
      moderation_score: 25,
      content_richness: { total: 55 },
    });

    const params = {
      p_config_id: config.id,
      p_max_moderation_score: 29,
      p_min_content_richness: 50,
    };

    const count = await callBulk("count_bulk_publish_targets", params);
    const updated = await callBulk("bulk_publish_reports", params);

    expect(count).toBe(updated);
    expect(count).toBe(2);
  });
});
