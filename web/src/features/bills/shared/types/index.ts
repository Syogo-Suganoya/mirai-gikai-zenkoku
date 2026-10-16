import type { Database, Enums, FuriganaSegment, Tables } from "@mirai-gikai/db";
import {
  BILL_CATEGORY_LABELS,
  BILL_RESULT_LABELS,
  BILL_STATUS_LABELS,
  BILL_STATUS_ORDER,
  FACTION_VOTE_LABELS,
} from "@mirai-gikai/shared/bills/labels";

// Database types
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];

export type BillContent = Database["public"]["Tables"]["bill_contents"]["Row"];
export type BillContentInsert =
  Database["public"]["Tables"]["bill_contents"]["Insert"];
export type BillContentUpdate =
  Database["public"]["Tables"]["bill_contents"]["Update"];

export type MiraiStance = Database["public"]["Tables"]["mirai_stances"]["Row"];
export type BillResultRow = Tables<"bill_results">;

export type { FuriganaSegment };

// Enums
export type BillStatusEnum = Enums<"bill_status_enum">;
export type BillCategoryEnum = Enums<"bill_category_enum">;
export type BillResultEnum = Enums<"bill_result_enum">;
export type FactionVoteEnum = Enums<"faction_vote_enum">;
export type VoteGranularity = Enums<"vote_granularity_enum">;
export type StanceTypeEnum = Enums<"stance_type_enum">;

// 公開ステータス型（議案の公開/非公開を管理）
export type BillPublishStatus = "draft" | "published" | "coming_soon";

// 掲載の段階（件名のみ / 解説付き）
export type BillPublishLevel = Enums<"bill_publish_level_enum">;

// Coming Soon議案の型（最小限の情報のみ）
export type ComingSoonBill = {
  id: string;
  name: string; // 正式名称
  title: string | null; // わかりやすいタイトル（bill_contentsから）
  /** 出典へのリンク（議案の原文、なければ議会のサイトの資料） */
  source_url: string | null;
};

// Combined types for UI
export type BillWithStance = Bill & {
  mirai_stance?: MiraiStance;
};

export type BillTag = {
  id: string;
  label: string;
};

export type FeaturedTag = {
  id: string;
  label: string;
  priority: number;
};

/** 会派ごとの賛否（議決結果の粒度が会派別の議会だけ） */
export type BillFactionVote = {
  faction_id: string;
  faction_name: string;
  vote: FactionVoteEnum;
};

export type BillWithContent = Bill & {
  /** 議会のスラッグ（URL を作るのに使う） */
  assembly_slug: string;
  bill_content?: BillContent;
  mirai_stance?: MiraiStance;
  tags: BillTag[];
  featured_tag?: FeaturedTag;
  hasPublicInterview?: boolean;
  /** 公開レポート件数。一覧の回答数バッジと「声が集まっている順」に使う。 */
  publicReportCount?: number;
  /** 議決結果（議決されていない・報告の議案は undefined） */
  bill_result?: BillResultRow;
};

// タグごとにグループ化された議案
export type BillsByTag = {
  tag: BillTag & { description?: string; priority: number };
  bills: BillWithContent[];
};

/** URL に使う議案の目印（slug があれば slug、なければ id） */
export function billKey(bill: { id: string; slug: string | null }): string {
  return bill.slug ?? bill.id;
}

// 表示名は管理画面と共通（@mirai-gikai/shared/bills/labels）
export {
  BILL_CATEGORY_LABELS,
  BILL_RESULT_LABELS,
  BILL_STATUS_LABELS,
  BILL_STATUS_ORDER,
  FACTION_VOTE_LABELS,
};

// ステータスを日本語ラベルに変換する関数
export function getBillStatusLabel(
  status: BillStatusEnum,
  result?: BillResultEnum | null
): string {
  if (status === "decided" && result) return BILL_RESULT_LABELS[result];
  return BILL_STATUS_LABELS[status] ?? status;
}

export const STANCE_LABELS: Record<StanceTypeEnum, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
  conditional_for: "条件付き賛成",
  conditional_against: "条件付き反対",
  considering: "検討中",
  continued_deliberation: "継続審査中",
  free_vote: "自由投票",
};
