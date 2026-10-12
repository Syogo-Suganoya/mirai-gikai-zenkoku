import type { AssemblyAccessRole } from "../types";

/**
 * 議会での役割の強さ（設計 v2 2.3節）。
 * 全体管理者 > 確認者（公開・解説の確定ができる） > 編集者（下書きまで）
 */
const ROLE_RANK: Record<AssemblyAccessRole, number> = {
  editor: 1,
  reviewer: 2,
  super_admin: 3,
};

/** role が required 以上の権限を持つか */
export function hasAssemblyRole(
  role: AssemblyAccessRole | null,
  required: AssemblyAccessRole
): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/** 全体管理者でなければ、議会の担当（assembly_members）の役割を使う */
export function resolveAssemblyRole(
  isSuperAdmin: boolean,
  memberRole: AssemblyAccessRole | null
): AssemblyAccessRole | null {
  return isSuperAdmin ? "super_admin" : memberRole;
}
