import type { Enums } from "@mirai-gikai/db";

/**
 * 議案まわりの表示名。公開サイト（web）と管理画面（admin）で同じものを使う。
 */

export type BillStatus = Enums<"bill_status_enum">;
export type BillCategory = Enums<"bill_category_enum">;
export type BillResult = Enums<"bill_result_enum">;
export type FactionVote = Enums<"faction_vote_enum">;
export type BillPublishLevel = Enums<"bill_publish_level_enum">;
export type SessionType = Enums<"session_type_enum">;

// ステータスのソート順（DBの status_order generated column と一致させる）
export const BILL_STATUS_ORDER: Record<BillStatus, number> = {
  decided: 0,
  continued: 1,
  withdrawn: 2,
  referred_to_committee: 3,
  introduced: 4,
  preparing: 5,
};

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  preparing: "準備中",
  introduced: "提出",
  referred_to_committee: "委員会で審査中",
  decided: "議決済み",
  continued: "継続審査",
  withdrawn: "撤回",
};

export const BILL_CATEGORY_LABELS: Record<BillCategory, string> = {
  budget: "予算",
  ordinance: "条例",
  personnel: "人事",
  contract: "契約",
  petition: "請願・陳情",
  report: "報告",
  other: "その他",
};

export const BILL_RESULT_LABELS: Record<BillResult, string> = {
  passed: "可決",
  amended: "修正可決",
  rejected: "否決",
  continued: "継続審査",
  withdrawn: "撤回",
  adopted: "採択",
  not_adopted: "不採択",
};

export const FACTION_VOTE_LABELS: Record<FactionVote, string> = {
  for: "賛成",
  against: "反対",
  abstain: "棄権",
  absent: "欠席",
  split: "分かれた",
};

export const BILL_PUBLISH_LEVEL_LABELS: Record<BillPublishLevel, string> = {
  title_only: "件名と原文のみ",
  explained: "解説あり",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  regular: "定例会",
  extraordinary: "臨時会",
};
