import { eq } from "@mirai-gikai/db/orm";
import { bills } from "@mirai-gikai/db/schema";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupTestBill, createTestBill, db } from "../utils";

describe("update_updated_at_column トリガー", () => {
  let billId: string | undefined;

  afterEach(async () => {
    if (billId) {
      await cleanupTestBill(billId);
      billId = undefined;
    }
  });

  it("UPDATE 時に updated_at が自動で更新される", async () => {
    const bill = await createTestBill();
    billId = bill.id;
    const originalUpdatedAt = bill.updated_at;

    // 少し待ってから更新（タイムスタンプの差を確実にする）
    await new Promise((r) => setTimeout(r, 100));

    await db
      .update(bills)
      .set({ name: "更新後の議案名" })
      .where(eq(bills.id, bill.id));

    const [updated] = await db
      .select({ updated_at: bills.updated_at })
      .from(bills)
      .where(eq(bills.id, bill.id));

    expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it("INSERT 時に updated_at にデフォルト値が設定される", async () => {
    const before = new Date();
    const bill = await createTestBill();
    billId = bill.id;
    const after = new Date();

    const updatedAt = new Date(bill.updated_at).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(updatedAt).toBeLessThanOrEqual(after.getTime() + 1000);
  });
});
