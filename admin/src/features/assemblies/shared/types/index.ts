import type { Database } from "@mirai-gikai/db";

export type Assembly = Database["public"]["Tables"]["assemblies"]["Row"];
export type AssemblySettings =
  Database["public"]["Tables"]["assembly_settings"]["Row"];
export type AssemblyMemberRole =
  Database["public"]["Enums"]["assembly_member_role_enum"];

/** 議会一覧の1行 */
export type AssemblyListItem = Pick<
  Assembly,
  "id" | "slug" | "name" | "type" | "prefecture_code" | "status"
> & {
  billCount: number;
  publishedBillCount: number;
  dummyBillCount: number;
};

/** ログイン中のユーザーがこの議会で持つ役割（全体管理者は "super_admin"） */
export type AssemblyAccessRole = AssemblyMemberRole | "super_admin";

export type AssemblyContext = {
  assembly: Assembly;
  settings: AssemblySettings;
  role: AssemblyAccessRole;
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
  /** AIインタビューを出すときに「届け先（意見を受け取る議員）がいる」と確認したか */
  interview_recipient_confirmed: boolean;
};

/** 設定がオンでも、データが0件なら公開側には出ない。その判定に使う件数 */
export type AssemblySettingsDataCounts = {
  publishedBills: number;
  publicInterviews: number;
  publishedStances: number;
};

/** 議会の担当者（確認者・編集者）の1行 */
export type AssemblyMember = {
  user_id: string;
  email: string;
  role: AssemblyMemberRole;
  display_name: string;
  affiliation: string;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
};

/** 担当者を追加・変更するときの入力 */
export type AssemblyMemberInput = {
  email: string;
  role: AssemblyMemberRole;
  display_name: string;
  affiliation: string;
};
