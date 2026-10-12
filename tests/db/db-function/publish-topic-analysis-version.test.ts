import { and, eq, sql } from "@mirai-gikai/db/orm";
import { topic_analysis_version } from "@mirai-gikai/db/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTestBill, createTestBill, db } from "../utils";

let billId: string;

async function insertVersion(version: number): Promise<string> {
  const [row] = await db
    .insert(topic_analysis_version)
    .values({
      bill_id: billId,
      version,
      status: "completed",
      trigger: "manual",
    })
    .returning({ id: topic_analysis_version.id });
  return row.id;
}

async function publishedIds(): Promise<string[]> {
  const data = await db
    .select({ id: topic_analysis_version.id })
    .from(topic_analysis_version)
    .where(
      and(
        eq(topic_analysis_version.bill_id, billId),
        eq(topic_analysis_version.is_published, true)
      )
    );
  return data.map((r) => r.id);
}

function publish(versionId: string) {
  return db.execute(
    sql`select publish_topic_analysis_version(${versionId}::uuid)`
  );
}

describe("publish_topic_analysis_version()", () => {
  beforeEach(async () => {
    const bill = await createTestBill();
    billId = bill.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
  });

  it("対象を公開し、同 bill の旧公開版は降ろす（公開は常に1版）", async () => {
    const v1 = await insertVersion(1);
    const v2 = await insertVersion(2);

    await publish(v1);
    expect(await publishedIds()).toEqual([v1]);

    await publish(v2);
    // v1 は降ろされ、公開は v2 の1版のみ
    expect(await publishedIds()).toEqual([v2]);
  });

  it("既に公開中の版を再公開しても1版のまま（冪等）", async () => {
    const v1 = await insertVersion(1);
    await publish(v1);
    await publish(v1);
    expect(await publishedIds()).toEqual([v1]);
  });

  it("存在しない version_id は例外を返す", async () => {
    await expect(
      publish("00000000-0000-0000-0000-000000000000")
    ).rejects.toThrow();
  });
});
