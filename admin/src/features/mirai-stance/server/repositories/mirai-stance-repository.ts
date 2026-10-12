import "server-only";

import { createDb } from "@mirai-gikai/db";
import { eq, sql } from "@mirai-gikai/db/orm";
import { mirai_stances } from "@mirai-gikai/db/schema";
import type { StanceInput } from "../../shared/types";
import { toStanceColumns } from "../../shared/utils/to-stance-columns";

export async function findStanceByBillId(
  billId: string
): Promise<typeof mirai_stances.$inferSelect | null> {
  const [row] = await createDb()
    .select()
    .from(mirai_stances)
    .where(eq(mirai_stances.bill_id, billId));
  return row ?? null;
}

export async function createMiraiStance(billId: string, input: StanceInput) {
  await createDb()
    .insert(mirai_stances)
    .values({ bill_id: billId, ...toStanceColumns(input) });
}

export async function updateMiraiStance(stanceId: string, input: StanceInput) {
  await createDb()
    .update(mirai_stances)
    .set({ ...toStanceColumns(input), updated_at: sql`now()` })
    .where(eq(mirai_stances.id, stanceId));
}

/**
 * bill_id をキーにスタンスを atomic に upsert する。
 * mirai_stances.bill_id は UNIQUE 制約があるため、onConflict で
 * 「あれば更新／なければ作成」を単一クエリで行い、check-then-act の競合を避ける。
 */
export async function upsertMiraiStance(billId: string, input: StanceInput) {
  const columns = toStanceColumns(input);
  await createDb()
    .insert(mirai_stances)
    .values({ bill_id: billId, ...columns })
    .onConflictDoUpdate({
      target: mirai_stances.bill_id,
      set: { ...columns, updated_at: sql`now()` },
    });
}

export async function deleteMiraiStance(stanceId: string) {
  await createDb().delete(mirai_stances).where(eq(mirai_stances.id, stanceId));
}
