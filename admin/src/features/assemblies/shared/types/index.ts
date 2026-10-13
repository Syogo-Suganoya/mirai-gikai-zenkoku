import type { Database } from "@mirai-gikai/db";

export type Assembly = Database["public"]["Tables"]["assemblies"]["Row"];
export type AssemblySettings =
  Database["public"]["Tables"]["assembly_settings"]["Row"];

/** 議会一覧の1行 */
export type AssemblyListItem = Pick<
  Assembly,
  "id" | "slug" | "name" | "type" | "prefecture_code" | "status"
> & {
  billCount: number;
  publishedBillCount: number;
  dummyBillCount: number;
};

export type AssemblyContext = {
  assembly: Assembly;
  settings: AssemblySettings;
};

export type VoteGranularity = AssemblySettings["vote_granularity"];
export type PublishLevel = AssemblySettings["default_publish_level"];

/** 議会設定画面の入力（設計 v2 2.7節） */
export type AssemblySettingsInput = {
  show_ai_chat: boolean;
  show_interview: boolean;
  show_mirai_stance: boolean;
  vote_granularity: VoteGranularity;
  default_publish_level: PublishLevel;
};

/** 設定がオンでも、データが0件なら公開側には出ない。その判定に使う件数 */
export type AssemblySettingsDataCounts = {
  publishedBills: number;
  publicInterviews: number;
  publishedStances: number;
};
