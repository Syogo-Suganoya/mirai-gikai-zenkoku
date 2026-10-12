import { uuidArray } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestInterviewConfig,
  createTestInterviewReport,
  createTestInterviewSession,
  createTestUser,
  rows,
} from "../utils";

type Row = { bill_id: string; report_count: string };

function countPublicReports(billIds: string[]) {
  return rows<Row>(
    sql`select * from count_public_reports_by_bill_ids(${uuidArray(billIds)})`
  );
}

/**
 * 公開の定義は「管理者公開 × ユーザー公開」。
 * 片方でも false なら数えない。一覧の回答数バッジが非公開のレポートを
 * 数えてしまうと、公開されていない意見の存在を数字で漏らすことになる。
 */
describe("count_public_reports_by_bill_ids", () => {
  let billPublic: { id: string };
  let billMixed: { id: string };
  let billEmpty: { id: string };
  let user: { id: string };

  // idx_interview_configs_bill_public により、公開設定は1議案1つまで。
  // レポートは同じ設定にセッションをぶら下げて増やす。
  async function insertReport(
    configId: string,
    flags: { admin: boolean; user: boolean }
  ) {
    const session = await createTestInterviewSession(configId, user.id);
    await createTestInterviewReport(session.id, {
      is_public_by_admin: flags.admin,
      is_public_by_user: flags.user,
    });
  }

  beforeAll(async () => {
    user = await createTestUser();
    billPublic = await createTestBill();
    billMixed = await createTestBill();
    billEmpty = await createTestBill();

    const configPublic = (await createTestInterviewConfig(billPublic.id)).id;
    await insertReport(configPublic, { admin: true, user: true });
    await insertReport(configPublic, { admin: true, user: true });

    // 公開1件＋非公開2件（管理者非公開・ユーザー非公開を1件ずつ）
    const configMixed = (await createTestInterviewConfig(billMixed.id)).id;
    await insertReport(configMixed, { admin: true, user: true });
    await insertReport(configMixed, { admin: false, user: true });
    await insertReport(configMixed, { admin: true, user: false });
  });

  afterAll(async () => {
    // 1件の失敗で残りの片付けを落とさない。
    await Promise.allSettled([
      cleanupTestBill(billPublic.id),
      cleanupTestBill(billMixed.id),
      cleanupTestBill(billEmpty.id),
    ]);
    await cleanupTestUser(user.id);
  });

  it("議案ごとの公開レポート件数を1クエリで返す", async () => {
    const data = await countPublicReports([billPublic.id, billMixed.id]);
    const counts = new Map(
      data.map((row) => [row.bill_id, Number(row.report_count)])
    );
    expect(counts.get(billPublic.id)).toBe(2);
    expect(counts.get(billMixed.id)).toBe(1);
  });

  it("公開レポートが0件の議案は結果に含まれない", async () => {
    expect(await countPublicReports([billEmpty.id])).toEqual([]);
  });

  it("指定していない議案は返さない", async () => {
    const data = await countPublicReports([billPublic.id]);
    expect(data.map((row) => row.bill_id)).toEqual([billPublic.id]);
  });

  it("空配列を渡しても落ちない", async () => {
    expect(await countPublicReports([])).toEqual([]);
  });
});
