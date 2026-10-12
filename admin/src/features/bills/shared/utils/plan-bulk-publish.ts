import type { AssemblyAccessRole } from "@/features/assemblies/shared/types";
import type { Bill, BillPublishStatus } from "../types";

export type BulkPublishPlan = {
  /** 公開状態が変わる議案 */
  targetIds: string[];
  /** すでにその公開状態の議案の数 */
  unchangedCount: number;
  /** 実行に要る役割。「解説あり」の議案を公開するときだけ確認者以上（設計 v2 2.8節） */
  requiredRole: Extract<AssemblyAccessRole, "editor" | "reviewer">;
};

/** 選んだ議案の公開状態をまとめて変えるときの、対象と必要な役割 */
export function planBulkPublishStatus(
  bills: ReadonlyArray<Pick<Bill, "id" | "publish_status" | "publish_level">>,
  newStatus: BillPublishStatus
): BulkPublishPlan {
  const targets = bills.filter((bill) => bill.publish_status !== newStatus);
  const publishesExplained =
    newStatus === "published" &&
    targets.some((bill) => bill.publish_level === "explained");
  return {
    targetIds: targets.map((bill) => bill.id),
    unchangedCount: bills.length - targets.length,
    requiredRole: publishesExplained ? "reviewer" : "editor",
  };
}
