import "server-only";

import { getCurrentUser } from "./session";

/**
 * 全体管理者としてログインしているユーザーを返す（そうでなければ null）。
 * 議会ごとの確認者・編集者の権限は requireAssemblyRole で見る。
 */
export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  if (!user?.is_super_admin) return null;
  return user;
}

/**
 * 全体管理者でなければエラーを投げる（Server Action・Route Handler 用）
 */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error("管理者権限が必要です");
  }
  return admin;
}
