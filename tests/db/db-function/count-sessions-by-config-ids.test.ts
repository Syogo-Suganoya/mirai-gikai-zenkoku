import { uuidArray } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { interview_configs, interview_sessions } from "@mirai-gikai/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  db,
  rows,
} from "../utils";

type Row = { interview_config_id: string; session_count: string };

function countSessions(configIds: string[]) {
  return rows<Row>(
    sql`select * from count_sessions_by_config_ids(${uuidArray(configIds)})`
  );
}

describe("count_sessions_by_config_ids", () => {
  let bill1: { id: string };
  let bill2: { id: string };
  let user: { id: string };
  let configId1: string;
  let configId2: string;
  let configIdEmpty: string;

  async function createConfig(
    billId: string,
    status: "public" | "closed",
    name: string
  ) {
    const [config] = await db
      .insert(interview_configs)
      .values({ bill_id: billId, status, name })
      .returning({ id: interview_configs.id });
    return config.id;
  }

  async function createSessions(configId: string, count: number) {
    await db.insert(interview_sessions).values(
      Array.from({ length: count }, () => ({
        interview_config_id: configId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      }))
    );
  }

  beforeAll(async () => {
    user = await createTestUser();
    bill1 = await createTestBill();
    bill2 = await createTestBill();

    configId1 = await createConfig(bill1.id, "public", "設定1");
    await createSessions(configId1, 3);

    configId2 = await createConfig(bill1.id, "closed", "設定2");
    await createSessions(configId2, 1);

    configIdEmpty = await createConfig(bill2.id, "closed", "設定3（空）");
  });

  afterAll(async () => {
    await cleanupTestBill(bill1.id);
    await cleanupTestBill(bill2.id);
    await cleanupTestUser(user.id);
  });

  it("複数configのセッション数を正しくカウントする", async () => {
    const data = await countSessions([configId1, configId2]);

    expect(data).toHaveLength(2);
    const map = new Map(
      data.map((r) => [r.interview_config_id, Number(r.session_count)])
    );
    expect(map.get(configId1)).toBe(3);
    expect(map.get(configId2)).toBe(1);
  });

  it("セッションが0件のconfigは結果に含まれない", async () => {
    expect(await countSessions([configIdEmpty])).toHaveLength(0);
  });

  it("空配列を渡すと空の結果を返す", async () => {
    expect(await countSessions([])).toHaveLength(0);
  });

  it("存在しないconfig IDを渡すと空の結果を返す", async () => {
    expect(
      await countSessions(["00000000-0000-0000-0000-000000000000"])
    ).toHaveLength(0);
  });
});
