import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import {
  deleteExpiredSessions,
  deleteSessionByHash,
  findUserBySessionHash,
  insertSession,
} from "../repositories/auth-repository";

/**
 * 管理画面のログインセッション（設計 v3 3.4.4節）。
 * Cookie にはランダムなトークンを入れ、DB にはその SHA-256 だけを保存する
 * （DB が漏れてもトークンを再現できない。ログアウトやユーザー削除で即座に無効になる）。
 */
export const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

export type CurrentUser = {
  id: string;
  email: string;
  must_change_password: boolean;
};

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** ログインのたびに新しいセッションを作る（既存のセッションは捨てる） */
export async function startSession(userId: string): Promise<void> {
  await endSession();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await insertSession(userId, hashToken(token), expiresAt);
  // 期限切れのセッションはついでに掃除する
  await deleteExpiredSessions();

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteSessionByHash(hashToken(token));
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findUserBySessionHash(hashToken(token));
}

/** Server Action の先頭で呼ぶ。middleware は Cookie の有無しか見ないので、ここで必ず DB と照合する */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインしてください");
  return user;
}

/**
 * ページ（レイアウト）の先頭で呼ぶ。未ログインならログイン画面へ、
 * 初期パスワードのままならパスワード変更画面へ送る。
 */
export async function requireUserPage(
  options: { allowMustChangePassword?: boolean } = {}
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(routes.login());
  if (user.must_change_password && !options.allowMustChangePassword) {
    redirect(routes.accountPassword());
  }
  return user;
}
