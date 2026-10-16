import type { Bill, BillPublishStatus } from "../types";

export type BillPublishLevel = Bill["publish_level"];

/** ダミーかどうかでの絞り込み */
export type BillDataKind = "real" | "dummy";

/** 議案一覧の絞り込み（URL の ?session=&publish=&level=&data=） */
export type BillListFilter = {
  sessionId: string | null;
  publishStatus: BillPublishStatus | null;
  publishLevel: BillPublishLevel | null;
  dataKind: BillDataKind | null;
};

export const BILL_DATA_KIND_LABELS: Record<BillDataKind, string> = {
  real: "実データだけ",
  dummy: "ダミーだけ",
};

/** 公開状態の表示名（公開状態のバッジと同じ） */
export const BILL_PUBLISH_STATUS_LABELS: Record<BillPublishStatus, string> = {
  draft: "下書き",
  coming_soon: "Coming Soon",
  published: "公開中",
};

const PUBLISH_STATUSES: readonly BillPublishStatus[] = [
  "draft",
  "coming_soon",
  "published",
];
const PUBLISH_LEVELS: readonly BillPublishLevel[] = ["title_only", "explained"];
const DATA_KINDS: readonly BillDataKind[] = ["real", "dummy"];

function pick<T extends string>(
  value: string | undefined,
  allowed: readonly T[]
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** URL の値を絞り込みにする。知らない値は「すべて」として扱う */
export function parseBillListFilter(params: {
  session?: string;
  publish?: string;
  level?: string;
  data?: string;
}): BillListFilter {
  return {
    sessionId: params.session || null,
    publishStatus: pick(params.publish, PUBLISH_STATUSES),
    publishLevel: pick(params.level, PUBLISH_LEVELS),
    dataKind: pick(params.data, DATA_KINDS),
  };
}

export function filterBills<
  T extends Pick<
    Bill,
    "session_id" | "publish_status" | "publish_level" | "is_dummy"
  >,
>(bills: readonly T[], filter: BillListFilter): T[] {
  return bills.filter(
    (bill) =>
      (filter.sessionId === null || bill.session_id === filter.sessionId) &&
      (filter.publishStatus === null ||
        bill.publish_status === filter.publishStatus) &&
      (filter.publishLevel === null ||
        bill.publish_level === filter.publishLevel) &&
      (filter.dataKind === null ||
        bill.is_dummy === (filter.dataKind === "dummy"))
  );
}

export function isFilterActive(filter: BillListFilter): boolean {
  return (
    filter.sessionId !== null ||
    filter.publishStatus !== null ||
    filter.publishLevel !== null ||
    filter.dataKind !== null
  );
}
