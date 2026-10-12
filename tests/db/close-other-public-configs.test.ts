import { eq } from "@mirai-gikai/db/orm";
import { interview_configs } from "@mirai-gikai/db/schema";
import { afterEach, describe, expect, it } from "vitest";
import { closeOtherPublicConfigs } from "../../admin/src/features/interview-config/server/repositories/interview-config-repository";
import { cleanupTestBill, createTestBill, db } from "./utils";

describe("closeOtherPublicConfigs", () => {
  const createdBillIds: string[] = [];

  afterEach(async () => {
    for (const id of createdBillIds) {
      await cleanupTestBill(id);
    }
    createdBillIds.length = 0;
  });

  async function createConfig(
    billId: string,
    status: "public" | "closed",
    name: string
  ) {
    const [data] = await db
      .insert(interview_configs)
      .values({ bill_id: billId, status, name })
      .returning();
    return data;
  }

  it("excludeなしで呼ぶと、対象billのpublicなconfigはclosedになる", async () => {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);
    const config = await createConfig(bill.id, "public", "公開中設定");

    await closeOtherPublicConfigs(bill.id);

    const [updated] = await db
      .select()
      .from(interview_configs)
      .where(eq(interview_configs.id, config.id));
    expect(updated?.status).toBe("closed");
  });

  it("既にclosedなconfigのupdated_atは変化しない", async () => {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);
    const config = await createConfig(bill.id, "closed", "クローズ済み設定");
    const originalUpdatedAt = config.updated_at;

    // UPDATE BEFORE トリガでupdated_atが上書きされないことを確認するため、
    // 時刻が進んだ状態で呼び出す
    await new Promise((r) => setTimeout(r, 50));
    await closeOtherPublicConfigs(bill.id);

    const [after] = await db
      .select()
      .from(interview_configs)
      .where(eq(interview_configs.id, config.id));
    expect(after?.updated_at).toBe(originalUpdatedAt);
  });

  it("別billのpublic configは影響を受けない", async () => {
    const billA = await createTestBill();
    const billB = await createTestBill();
    createdBillIds.push(billA.id, billB.id);
    const configA = await createConfig(billA.id, "public", "bill Aの設定");
    const configB = await createConfig(billB.id, "public", "bill Bの設定");

    await closeOtherPublicConfigs(billA.id);

    const [afterA] = await db
      .select()
      .from(interview_configs)
      .where(eq(interview_configs.id, configA.id));
    const [afterB] = await db
      .select()
      .from(interview_configs)
      .where(eq(interview_configs.id, configB.id));
    expect(afterA?.status).toBe("closed");
    expect(afterB?.status).toBe("public");
  });

  it("excludeConfigIdを渡すと、該当configは除外される", async () => {
    // 注: interview_configs には bill_id に対して public が 1 件という
    // 部分unique制約があるため、同一billで public を2件作れない。
    // そのため、別billで public を作り、exclude の挙動を確認する。
    const bill = await createTestBill();
    createdBillIds.push(bill.id);
    const kept = await createConfig(bill.id, "public", "残す設定");

    await closeOtherPublicConfigs(bill.id, kept.id);

    const [after] = await db
      .select()
      .from(interview_configs)
      .where(eq(interview_configs.id, kept.id));
    expect(after?.status).toBe("public");
  });

  it("対象のconfigが存在しなくてもエラーにならない", async () => {
    const bill = await createTestBill();
    createdBillIds.push(bill.id);

    await expect(closeOtherPublicConfigs(bill.id)).resolves.toBeUndefined();
  });
});
