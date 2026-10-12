import "server-only";

import { notFound } from "next/navigation";
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

/**
 * 全体管理者だけのページの先頭で呼ぶ。全体管理者でなければ 404。
 * インタビュー・トピック分析・タグなどは、議会の担当者（確認者・編集者）にはまだ開放していない。
 */
export async function requireSuperAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  return admin;
}
