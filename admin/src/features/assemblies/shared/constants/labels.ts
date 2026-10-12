import type { AssemblyMemberRole } from "../types";

export const ASSEMBLY_MEMBER_ROLE_LABELS: Record<AssemblyMemberRole, string> = {
  reviewer: "確認者",
  editor: "編集者",
};

export const ASSEMBLY_MEMBER_ROLE_DESCRIPTIONS: Record<
  AssemblyMemberRole,
  string
> = {
  reviewer:
    "議案の登録・編集・公開、会期・CSV 取り込み、議会設定の変更ができます",
  editor: "議案の登録・編集ができます（公開はできません）",
};
