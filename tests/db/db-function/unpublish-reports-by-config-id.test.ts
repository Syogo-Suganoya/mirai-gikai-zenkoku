import { eq, sql } from "@mirai-gikai/db/orm";
import { interview_report } from "@mirai-gikai/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestInterviewConfig,
  createTestInterviewReport,
  createTestInterviewSession,
  createTestUser,
  db,
} from "../utils";

/**
 * 指定 config 配下にセッション＋レポートを作成し、レポートIDを返すヘルパー
 */
async function createSessionWithReport(
  configId: string,
  userId: string,
  flags: { is_public_by_admin: boolean; is_public_by_user: boolean }
): Promise<string> {
  const session = await createTestInterviewSession(configId, userId);
  return (await createTestInterviewReport(session.id, flags)).id;
}

async function getReport(reportId: string) {
  const [row] = await db
    .select({
      is_public_by_admin: interview_report.is_public_by_admin,
      admin_unpublished_at: interview_report.admin_unpublished_at,
    })
    .from(interview_report)
    .where(eq(interview_report.id, reportId));
  return row;
}

function unpublish(configId: string) {
  return db.execute(
    sql`select unpublish_reports_by_config_id(${configId}::uuid)`
  );
}

describe("unpublish_reports_by_config_id", () => {
  let bill: { id: string };
  let user: { id: string };
  let targetConfigId: string;
  let otherConfigId: string;

  // target config 配下のレポート
  let publicReportId: string;
  let userPrivateReportId: string; // is_public_by_admin=true, is_public_by_user=false
  let alreadyPrivateReportId: string; // is_public_by_admin=false
  // 別 config の公開レポート（影響を受けないことの確認用）
  let otherPublicReportId: string;

  beforeAll(async () => {
    user = await createTestUser();
    bill = await createTestBill();

    targetConfigId = (
      await createTestInterviewConfig(bill.id, { name: "削除対象設定" })
    ).id;
    otherConfigId = (
      await createTestInterviewConfig(bill.id, {
        status: "closed",
        name: "別設定",
      })
    ).id;

    publicReportId = await createSessionWithReport(targetConfigId, user.id, {
      is_public_by_admin: true,
      is_public_by_user: true,
    });
    userPrivateReportId = await createSessionWithReport(
      targetConfigId,
      user.id,
      { is_public_by_admin: true, is_public_by_user: false }
    );
    alreadyPrivateReportId = await createSessionWithReport(
      targetConfigId,
      user.id,
      { is_public_by_admin: false, is_public_by_user: true }
    );
    otherPublicReportId = await createSessionWithReport(
      otherConfigId,
      user.id,
      { is_public_by_admin: true, is_public_by_user: true }
    );
  });

  afterAll(async () => {
    await cleanupTestBill(bill.id);
    await cleanupTestUser(user.id);
  });

  it("対象config配下の公開レポートを非公開(is_public_by_admin=false)にする", async () => {
    await unpublish(targetConfigId);

    expect((await getReport(publicReportId)).is_public_by_admin).toBe(false);
    // is_public_by_user に関わらず admin フラグを下げる
    expect((await getReport(userPrivateReportId)).is_public_by_admin).toBe(
      false
    );
    // もともと非公開のものは false のまま
    expect((await getReport(alreadyPrivateReportId)).is_public_by_admin).toBe(
      false
    );
  });

  it("対象config配下のレポートに管理者非公開の記録を残す", async () => {
    await unpublish(targetConfigId);

    expect(
      (await getReport(publicReportId)).admin_unpublished_at
    ).not.toBeNull();
    // もともと非公開のレポートも、ユーザー操作で公開されないよう記録する
    expect(
      (await getReport(alreadyPrivateReportId)).admin_unpublished_at
    ).not.toBeNull();
    // 別configのレポートには記録を残さない
    expect(
      (await getReport(otherPublicReportId)).admin_unpublished_at
    ).toBeNull();
  });

  it("別configのレポートには影響しない", async () => {
    await unpublish(targetConfigId);

    expect((await getReport(otherPublicReportId)).is_public_by_admin).toBe(
      true
    );
  });

  it("存在しないconfig IDを渡してもエラーにならない（no-op）", async () => {
    await expect(
      unpublish("00000000-0000-0000-0000-000000000000")
    ).resolves.toBeDefined();
  });
});
