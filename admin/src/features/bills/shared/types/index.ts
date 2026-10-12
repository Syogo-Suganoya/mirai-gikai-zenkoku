import type { Database } from "@mirai-gikai/db";
import {
  BILL_STATUS_LABELS,
  BILL_STATUS_ORDER,
  type BillStatus,
} from "@mirai-gikai/shared/bills/labels";

export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];

export type { BillStatus };
export type BillPublishStatus =
  Database["public"]["Enums"]["bill_publish_status"];

export type BillWithContent = Bill & {
  bill_content?: Database["public"]["Tables"]["bill_contents"]["Row"];
};

/** 議案一覧の1行（会期名つき） */
export type BillWithSession = Bill & {
  session: { name: string } | null;
};

import type { SortConfig } from "@/lib/sort";

// ソート関連の型定義
export type BillSortField =
  | "created_at"
  | "submitted_date"
  | "status_order"
  | "publish_status_order";

export const BILL_SORT_FIELDS: readonly BillSortField[] = [
  "created_at",
  "submitted_date",
  "status_order",
  "publish_status_order",
] as const;

export type BillSortConfig = SortConfig<BillSortField>;

export const DEFAULT_BILL_SORT: BillSortConfig = {
  field: "created_at",
  order: "desc",
};

// ステータスのソート順（DBのstatus_order generated columnと一致させる）
export { BILL_STATUS_ORDER };

// ステータスを日本語ラベルに変換する関数
export function getBillStatusLabel(status: BillStatus): string {
  return BILL_STATUS_LABELS[status] ?? status;
}
