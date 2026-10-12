import type { BillUpdateInput } from "../types";

/**
 * 議案のステータス変更時に、関連する公開中インタビューを自動クローズすべきかを判定する。
 * 議決済み・撤回になった議案は、もう意見を集めても審議に届かないので閉じる。
 */
export function shouldAutoCloseInterviewOnBillStatus(
  status: BillUpdateInput["status"]
): boolean {
  return status === "decided" || status === "withdrawn";
}
