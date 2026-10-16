import "server-only";

import { requireBillAction } from "@/features/bills/server/loaders/require-bill-access";
import { findStanceBillId } from "../repositories/mirai-stance-repository";

/**
 * スタンスを変える Server Action 用。
 * チームみらいの議員がいる議会（has_mirai_member）のときだけ通す。
 */
export async function requireStanceAction(target: {
  billId?: string;
  stanceId?: string;
}) {
  const billId =
    target.billId ??
    (target.stanceId ? await findStanceBillId(target.stanceId) : null);
  if (!billId) throw new Error("スタンスが見つかりません");
  const context = await requireBillAction(billId);
  if (!context.assembly.has_mirai_member) {
    throw new Error(
      "チームみらいの議員がいない議会では、スタンスを設定できません"
    );
  }
  return context;
}
