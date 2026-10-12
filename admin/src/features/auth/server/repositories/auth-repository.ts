import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, eq, gt, lt, sql } from "@mirai-gikai/db/orm";
import { user_sessions, users } from "@mirai-gikai/db/schema";

const userColumns = {
  id: users.id,
  email: users.email,
  is_super_admin: users.is_super_admin,
  must_change_password: users.must_change_password,
};

/** メールアドレスとパスワードが合っていればユーザーを返す（照合は pgcrypto の crypt で DB 側） */
export async function findUserByCredentials(email: string, password: string) {
  const [row] = await createDb()
    .select(userColumns)
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = lower(${email})`,
        sql`${users.password_hash} = crypt(${password}, ${users.password_hash})`
      )
    );
  return row ?? null;
}

/** パスワードだけを照合する（パスワード変更で今のパスワードを確かめる） */
export async function verifyUserPassword(userId: string, password: string) {
  const [row] = await createDb()
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        sql`${users.password_hash} = crypt(${password}, ${users.password_hash})`
      )
    );
  return Boolean(row);
}

export async function updateUserPassword(userId: string, password: string) {
  await createDb()
    .update(users)
    .set({
      password_hash: sql`crypt(${password}, gen_salt('bf'))`,
      must_change_password: false,
    })
    .where(eq(users.id, userId));
}

export async function touchLastLogin(userId: string) {
  await createDb()
    .update(users)
    .set({ last_login_at: sql`now()` })
    .where(eq(users.id, userId));
}

export async function insertSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date
) {
  await createDb().insert(user_sessions).values({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });
}

export async function deleteSessionByHash(tokenHash: string) {
  await createDb()
    .delete(user_sessions)
    .where(eq(user_sessions.token_hash, tokenHash));
}

/** ユーザーのセッションをすべて消す（パスワード変更時に他の端末からもログアウトさせる） */
export async function deleteSessionsByUserId(userId: string) {
  await createDb()
    .delete(user_sessions)
    .where(eq(user_sessions.user_id, userId));
}

export async function deleteExpiredSessions() {
  await createDb()
    .delete(user_sessions)
    .where(lt(user_sessions.expires_at, sql`now()`));
}

/** 有効なセッションのユーザーを返す */
export async function findUserBySessionHash(tokenHash: string) {
  const [row] = await createDb()
    .select(userColumns)
    .from(user_sessions)
    .innerJoin(users, eq(users.id, user_sessions.user_id))
    .where(
      and(
        eq(user_sessions.token_hash, tokenHash),
        gt(user_sessions.expires_at, sql`now()`)
      )
    );
  return row ?? null;
}
