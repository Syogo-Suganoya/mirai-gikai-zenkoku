import type { Tx } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { users } from "@mirai-gikai/db/schema";

/** ローカル開発用の全体管理者（SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD で上書きできる） */
export const LOCAL_ADMIN_EMAIL = "admin@example.com";
export const LOCAL_ADMIN_PASSWORD = "local-admin-password";

/**
 * ローカル開発用の全体管理者を作る。固定パスワードのアカウントがホスト環境に作られないよう、
 * 呼び出し側でローカルの DB に接続しているときだけ呼ぶ。
 */
export async function seedLocalAdmin(tx: Tx) {
  const email = process.env.SEED_ADMIN_EMAIL || LOCAL_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD || LOCAL_ADMIN_PASSWORD;
  await tx
    .insert(users)
    .values({
      email,
      password_hash: sql`crypt(${password}, gen_salt('bf'))`,
      is_super_admin: true,
      must_change_password: false,
    })
    .onConflictDoNothing();
  return email;
}
