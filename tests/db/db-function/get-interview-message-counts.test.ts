import { uuidArray } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestInterviewData,
  createTestInterviewMessages,
  createTestUser,
  rows,
  type TestUser,
} from "../utils";

type Row = { interview_session_id: string; message_count: string };

function messageCounts(sessionIds: string[]) {
  return rows<Row>(
    sql`select * from get_interview_message_counts(${uuidArray(sessionIds)})`
  );
}

describe("get_interview_message_counts() 関数", () => {
  let testUser: TestUser;
  let billIds: string[] = [];

  beforeEach(async () => {
    testUser = await createTestUser();
    billIds = [];
  });

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    await cleanupTestUser(testUser.id);
  });

  it("複数セッションのメッセージ数を正しく返す", async () => {
    const data1 = await createTestInterviewData(testUser.id);
    billIds.push(data1.bill.id);
    await createTestInterviewMessages(data1.session.id, 3);

    const data2 = await createTestInterviewData(testUser.id);
    billIds.push(data2.bill.id);
    await createTestInterviewMessages(data2.session.id, 5);

    const data = await messageCounts([data1.session.id, data2.session.id]);
    expect(data).toHaveLength(2);

    const count = (id: string) =>
      Number(data.find((r) => r.interview_session_id === id)?.message_count);
    expect(count(data1.session.id)).toBe(3);
    expect(count(data2.session.id)).toBe(5);
  });

  it("メッセージが0件のセッションは結果に含まれない", async () => {
    const data1 = await createTestInterviewData(testUser.id);
    billIds.push(data1.bill.id);

    expect(await messageCounts([data1.session.id])).toHaveLength(0);
  });

  it("空の session_ids 配列を渡すと空の結果を返す", async () => {
    expect(await messageCounts([])).toHaveLength(0);
  });

  it("存在しない UUID を渡してもエラーにならない", async () => {
    expect(
      await messageCounts(["00000000-0000-0000-0000-000000000000"])
    ).toHaveLength(0);
  });
});
