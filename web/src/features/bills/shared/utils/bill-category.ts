import { BILL_CATEGORY_LABELS, type BillCategoryEnum } from "../types";

/** 種類の並び順（タブ・絞り込みチップの順） */
export const BILL_CATEGORIES = Object.keys(
  BILL_CATEGORY_LABELS
) as BillCategoryEnum[];

export function isBillCategory(value: unknown): value is BillCategoryEnum {
  return (
    typeof value === "string" &&
    (BILL_CATEGORIES as readonly string[]).includes(value)
  );
}

export type BillCategoryCount = {
  category: BillCategoryEnum;
  label: string;
  count: number;
};

/**
 * 種類ごとの件数を、決まった順に並べる。0件の種類は出さない
 * （押しても何も出ないタブを並べない）。
 */
export function toBillCategoryCounts(
  counts: Partial<Record<BillCategoryEnum, number>>
): BillCategoryCount[] {
  return BILL_CATEGORIES.map((category) => ({
    category,
    label: BILL_CATEGORY_LABELS[category],
    count: counts[category] ?? 0,
  })).filter((item) => item.count > 0);
}

/** 議案の配列から種類ごとの件数を数える */
export function countByCategory(
  bills: readonly { category: BillCategoryEnum }[]
): Partial<Record<BillCategoryEnum, number>> {
  const counts: Partial<Record<BillCategoryEnum, number>> = {};
  for (const bill of bills) {
    counts[bill.category] = (counts[bill.category] ?? 0) + 1;
  }
  return counts;
}
