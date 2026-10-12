import "server-only";

import { createDb } from "@mirai-gikai/db";
import { asc, eq, sql } from "@mirai-gikai/db/orm";
import { user_sessions, users } from "@mirai-gikai/db/schema";

/** 管理画面のアカウント一覧（パスワードのハッシュは返さない） */
export async function findAdminUsers() {
  return createDb()
    .select({
      id: users.id,
      email: users.email,
      is_super_admin: users.is_super_admin,
      must_change_password: users.must_change_password,
      created_at: users.created_at,
      last_login_at: users.last_login_at,
    })
    .from(users)
    .orderBy(asc(users.created_at));
}

export async function findUserIdByEmail(email: string) {
  const [row] = await createDb()
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`);
  return row?.id ?? null;
}

/** アカウントを作る。パスワードは pgcrypto の bcrypt でハッシュ化して保存する */
export async function insertUser(params: {
  email: string;
  password: string;
  isSuperAdmin: boolean;
}) {
  const [row] = await createDb()
    .insert(users)
    .values({
      email: params.email,
      password_hash: sql`crypt(${params.password}, gen_salt('bf'))`,
      is_super_admin: params.isSuperAdmin,
      must_change_password: true,
    })
    .returning({ id: users.id });
  return row.id;
}

/**
 * 初期パスワードを発行し直す。次のログインで変更させ、今のセッションはすべて無効にする。
 */
export async function resetUserPassword(userId: string, password: string) {
  await createDb().transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        password_hash: sql`crypt(${password}, gen_salt('bf'))`,
        must_change_password: true,
      })
      .where(eq(users.id, userId));
    await tx.delete(user_sessions).where(eq(user_sessions.user_id, userId));
  });
}

export async function deleteUser(userId: string) {
  await createDb().delete(users).where(eq(users.id, userId));
}
