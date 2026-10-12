import { isMiraiStancePublished } from "@mirai-gikai/shared/mirai-stance/publish-schedule";
import {
  BILL_CATEGORY_LABELS,
  BILL_RESULT_LABELS,
  type BillCategoryEnum,
  type BillPublishLevel,
  type BillResultEnum,
  type BillStatusEnum,
  getBillStatusLabel,
  type MiraiStance,
  STANCE_LABELS,
} from "@/features/bills/shared/types";
import type {
  OpenDataBillDetail,
  OpenDataBillItem,
  OpenDataBillResult,
  OpenDataMiraiStance,
} from "../types/open-data-bills";

type OpenDataMiraiStanceRow = Pick<
  MiraiStance,
  "type" | "comment" | "publish_at"
>;

type OpenDataBillResultRow = {
  result: BillResultEnum;
  decided_on: string | null;
};

export type OpenDataBillRow = {
  id: string;
  bill_number: string;
  name: string;
  category: BillCategoryEnum;
  publish_level: BillPublishLevel;
  status: BillStatusEnum;
  status_note: string | null;
  submitted_date: string | null;
  published_at: string | null;
  created_at: string;
  assembly: { slug: string; name: string };
  bill_result: OpenDataBillResultRow | null;
  /** 難易度で絞り込み済みのため0件（件名のみ）か1件 */
  bill_contents: { title: string; summary: string }[];
  mirai_stances: OpenDataMiraiStanceRow | null;
  bills_tags: { tags: { id: string; label: string } | null }[];
};

/**
 * DBの議案行をオープンデータAPIのレスポンス項目に変換する。
 */
export function toOpenDataBillItem(
  row: OpenDataBillRow,
  now: Date
): OpenDataBillItem {
  const billContent = row.bill_contents[0];
  return {
    billId: row.id,
    assemblySlug: row.assembly.slug,
    assemblyName: row.assembly.name,
    billNumber: row.bill_number,
    name: row.name,
    category: row.category,
    categoryLabel: BILL_CATEGORY_LABELS[row.category],
    publishLevel: row.publish_level,
    title: billContent?.title ?? row.name,
    summary: billContent?.summary ?? "",
    status: row.status,
    statusLabel: getBillStatusLabel(row.status, row.bill_result?.result),
    statusNote: row.status_note,
    result: toOpenDataBillResult(row.bill_result),
    submittedDate: row.submitted_date,
    publishedAt: row.published_at,
    tags: row.bills_tags.flatMap((billTag) =>
      billTag.tags ? [{ id: billTag.tags.id, label: billTag.tags.label }] : []
    ),
    miraiStance: toOpenDataMiraiStance(row.mirai_stances, now),
    createdAt: row.created_at,
  };
}

export type OpenDataBillDetailRow = Omit<OpenDataBillRow, "bill_contents"> & {
  bill_contents: { title: string; summary: string; content: string }[];
};

/**
 * DBの議案行（本文付き）をオープンデータAPIの詳細レスポンスに変換する。
 */
export function toOpenDataBillDetail(
  row: OpenDataBillDetailRow,
  now: Date
): OpenDataBillDetail {
  return {
    ...toOpenDataBillItem(row, now),
    content: row.bill_contents[0]?.content ?? "",
  };
}

/**
 * 議決結果の行をレスポンス形式（日本語ラベル付き）に変換する。
 */
export function toOpenDataBillResult(
  row: OpenDataBillResultRow | null
): OpenDataBillResult | null {
  if (!row) return null;
  return {
    result: row.result,
    label: BILL_RESULT_LABELS[row.result],
    decidedOn: row.decided_on,
  };
}

/**
 * チームみらいの賛否行をレスポンス形式（日本語ラベル付き）に変換する。
 * 公開日時前の賛否は未設定（null）として扱う。
 */
export function toOpenDataMiraiStance(
  stance: OpenDataMiraiStanceRow | null,
  now: Date
): OpenDataMiraiStance | null {
  if (!stance || !isMiraiStancePublished(stance.publish_at, now)) return null;
  return {
    type: stance.type,
    label: STANCE_LABELS[stance.type],
    comment: stance.comment,
  };
}
