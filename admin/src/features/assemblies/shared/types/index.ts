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
