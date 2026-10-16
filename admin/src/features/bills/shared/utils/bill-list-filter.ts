import type { Bill, BillPublishStatus } from "../types";

export type BillPublishLevel = Bill["publish_level"];

/** ダミーかどうかでの絞り込み */
export type BillDataKind = "real" | "dummy";

/** 議案一覧の絞り込み（URL の ?session=&publish=&level=&data=） */
export type BillListFilter = {
  sessionId: string | null;
  publishStatus: BillPublishStatus | null;
  publishLevel: BillPublishLevel | null;
  /** 出典の更新の余地がある議案だけ。掲載のしかたのプルダウンで選ぶ（level=source_todo） */
  sourceTodo: boolean;
  dataKind: BillDataKind | null;
};

/** 掲載のしかたのプルダウンで「出典の更新の余地あり」を表す値 */
export const SOURCE_TODO_LEVEL = "source_todo";
export const SOURCE_TODO_LABEL = "出典の更新の余地あり";

/** 議案一覧のアイコンにホバーしたときの説明 */
export const SOURCE_TODO_DESCRIPTION =
  "議案の原文が未登録（いまは議会のサイトの資料を表示）";

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
    sourceTodo: params.level === SOURCE_TODO_LEVEL,
    dataKind: pick(params.data, DATA_KINDS),
  };
}

export function filterBills<
  T extends Pick<
    Bill,
    | "session_id"
    | "publish_status"
    | "publish_level"
    | "is_dummy"
    | "source_needs_update"
  >,
>(bills: readonly T[], filter: BillListFilter): T[] {
  return bills.filter(
    (bill) =>
      (filter.sessionId === null || bill.session_id === filter.sessionId) &&
      (filter.publishStatus === null ||
        bill.publish_status === filter.publishStatus) &&
      (filter.publishLevel === null ||
        bill.publish_level === filter.publishLevel) &&
      (!filter.sourceTodo || bill.source_needs_update) &&
      (filter.dataKind === null ||
        bill.is_dummy === (filter.dataKind === "dummy"))
  );
}

export function isFilterActive(filter: BillListFilter): boolean {
  return (
    filter.sessionId !== null ||
    filter.publishStatus !== null ||
    filter.publishLevel !== null ||
    filter.sourceTodo ||
    filter.dataKind !== null
  );
}
