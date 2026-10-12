import type { Enums } from "@mirai-gikai/db";

export type CsvImportKind = Enums<"csv_import_kind_enum">;
export type AssemblyType = Enums<"assembly_type_enum">;
export type SessionType = Enums<"session_type_enum">;
export type BillCategory = Enums<"bill_category_enum">;
export type BillStatus = Enums<"bill_status_enum">;
export type BillResult = Enums<"bill_result_enum">;
export type FactionVote = Enums<"faction_vote_enum">;
export type VoteGranularity = Enums<"vote_granularity_enum">;

/** 一度に扱う行数の上限（議会マスタの全国分が入る大きさ） */
export const MAX_CSV_ROWS = 5000;

export const CSV_IMPORT_KIND_LABELS: Record<CsvImportKind, string> = {
  assemblies: "議会マスタ",
  factions: "会派",
  sessions: "会期",
  bills: "議案",
  results: "議決結果・会派ごとの賛否",
};

export const ASSEMBLY_TYPE_LABELS: Record<AssemblyType, string> = {
  prefecture: "都道府県",
  city: "市",
  special_ward: "特別区",
  town: "町",
  village: "村",
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  regular: "定例会",
  extraordinary: "臨時会",
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

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  preparing: "準備中",
  introduced: "提出",
  referred_to_committee: "委員会付託",
  decided: "議決済み",
  continued: "継続審査",
  withdrawn: "撤回",
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

export const VOTE_GRANULARITY_LABELS: Record<VoteGranularity, string> = {
  member: "議員別",
  faction: "会派別",
  count: "票数のみ",
  result_only: "可否のみ",
  unpublished: "非公開",
};

// ── 正規化したあとの1行（種類ごと） ──────────────────────

export type AssemblyRecord = {
  local_gov_code: string;
  name: string;
  type: AssemblyType;
  prefecture_code: string;
  slug: string | null;
  official_url: string | null;
};

export type FactionRecord = {
  name: string;
  short_name: string | null;
  seats: number | null;
  valid_from: string;
  valid_to: string | null;
};

export type SessionRecord = {
  session_key: string;
  name: string;
  type: SessionType;
  start_date: string;
  end_date: string;
  source_url: string | null;
};

export type BillRecord = {
  session_key: string;
  bill_number: string;
  official_name: string;
  /** 空なら正式名称を使う */
  name: string | null;
  category: BillCategory;
  submitter: string | null;
  submitted_date: string | null;
  committee_name: string | null;
  /** 空なら新規は「提出」、更新は変えない */
  status: BillStatus | null;
  source_url: string | null;
  source_pages: string | null;
  /** 空なら変えない */
  tags: string[] | null;
};

export type FactionVoteRecord = { faction_name: string; vote: FactionVote };

export type ResultRecord = {
  session_key: string;
  bill_number: string;
  result: BillResult;
  decided_on: string | null;
  yes_count: number | null;
  no_count: number | null;
  source_url: string | null;
  faction_votes: FactionVoteRecord[];
};

export type CsvRecordByKind = {
  assemblies: AssemblyRecord;
  factions: FactionRecord;
  sessions: SessionRecord;
  bills: BillRecord;
  results: ResultRecord;
};

export type AnyCsvRecord = CsvRecordByKind[CsvImportKind];

/** 行ごとのエラー・警告。row は CSV の行番号（見出しが1行目） */
export type CsvIssue = {
  row: number;
  column: string | null;
  message: string;
};

/** 読み込んだ1行（見出しで列名に対応づけたもの） */
export type CsvRow = {
  row: number;
  values: Record<string, string>;
  /** 列定義にない列（議決結果の会派名の列） */
  extra: Record<string, string>;
};
