import { billKey } from "@/features/bills/shared/types";
import { routes } from "@/lib/routes";
import type { OpenDataOpenInterviewItem } from "../types/open-data-open-interviews";

export type OpenDataOpenInterviewRow = {
  estimated_duration: number | null;
  created_at: string;
  bills: {
    id: string;
    slug: string | null;
    name: string;
    /** 議会のスラッグ（URL の /[assembly]） */
    assembly_slug: string;
    thumbnail_url: string | null;
    /** 難易度で絞り込み済みのため実質1件 */
    bill_contents: { title: string; summary: string }[];
  };
};

/**
 * 受付中のインタビュー設定行（議案付き）をオープンデータAPIのレスポンス項目に変換する。
 * インタビューページのURLは webUrl を起点に絶対URLで組み立てる。
 */
export function toOpenDataOpenInterviewItem(
  row: OpenDataOpenInterviewRow,
  webUrl: string
): OpenDataOpenInterviewItem {
  const billContent = row.bills.bill_contents[0];
  return {
    billId: row.bills.id,
    billName: row.bills.name,
    title: billContent?.title ?? "",
    summary: billContent?.summary ?? "",
    thumbnailUrl: row.bills.thumbnail_url,
    estimatedDurationMinutes: row.estimated_duration,
    interviewUrl: new URL(
      routes.interviewLP(row.bills.assembly_slug, billKey(row.bills)),
      webUrl
    ).toString(),
    createdAt: row.created_at,
  };
}
