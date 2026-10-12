import type { BillResultEnum, BillStatusEnum } from "../types";
import { isPassedResult } from "./bill-status";

/**
 * 議案一覧のステータス絞り込みで使うグループ。
 * 地方議会の審議（提出 → 委員会付託 → 本会議で議決）に合わせ、議決済みは結果で分ける。
 */
export const BILL_STATUS_GROUPS = [
  "all",
  "deliberating",
  "passed",
  "rejected",
  "continued",
] as const;

export type BillStatusGroup = (typeof BILL_STATUS_GROUPS)[number];

export const BILL_STATUS_GROUP_LABELS: Record<BillStatusGroup, string> = {
  all: "すべて",
  deliberating: "審議中",
  passed: "可決",
  rejected: "否決",
  continued: "継続・撤回",
};

type StatusLike = {
  status: BillStatusEnum;
  bill_result?: { result: BillResultEnum } | null;
};

/** status（と議決結果）をタブのグループに畳む */
export function toBillStatusGroup(
  bill: StatusLike
): Exclude<BillStatusGroup, "all"> {
  switch (bill.status) {
    case "decided": {
      const result = bill.bill_result?.result;
      return !result || isPassedResult(result) ? "passed" : "rejected";
    }
    case "continued":
    case "withdrawn":
      return "continued";
    default:
      return "deliberating";
  }
}

/** 文字列をグループに絞り込む型ガード。URL 直打ちで壊れないようにする。 */
export function isBillStatusGroup(value: unknown): value is BillStatusGroup {
  return (
    typeof value === "string" &&
    (BILL_STATUS_GROUPS as readonly string[]).includes(value)
  );
}

/** グループごとの件数。呼び出し側が渡した母集合をそのまま数える。 */
export function countByStatusGroup(
  bills: readonly StatusLike[]
): Record<BillStatusGroup, number> {
  const counts: Record<BillStatusGroup, number> = {
    all: bills.length,
    deliberating: 0,
    passed: 0,
    rejected: 0,
    continued: 0,
  };
  for (const bill of bills) {
    counts[toBillStatusGroup(bill)] += 1;
  }
  return counts;
}

/** グループで絞る。`all` は素通し。 */
export function filterByStatusGroup<T extends StatusLike>(
  bills: readonly T[],
  group: BillStatusGroup
): T[] {
  if (group === "all") return [...bills];
  return bills.filter((bill) => toBillStatusGroup(bill) === group);
}
