import type { Bill, BillPublishStatus } from "../types";

export type BulkPublishPlan = {
  /** 公開状態が変わる議案 */
  targetIds: string[];
  /** すでにその公開状態の議案の数 */
  unchangedCount: number;
};

/** 選んだ議案の公開状態をまとめて変えるときの対象（すでにその状態の議案は外す） */
export function planBulkPublishStatus(
  bills: ReadonlyArray<Pick<Bill, "id" | "publish_status">>,
  newStatus: BillPublishStatus
): BulkPublishPlan {
  const targets = bills.filter((bill) => bill.publish_status !== newStatus);
  return {
    targetIds: targets.map((bill) => bill.id),
    unchangedCount: bills.length - targets.length,
  };
}
