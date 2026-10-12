/**
 * 最初の全体管理者を作る（設計 v3 3.4.4節）。2人目以降は管理画面の担当者管理から作る。
 *   pnpm admin:create someone@example.com
 *
 * 初期パスワードを1度だけ表示する。本人は初回ログインで変更する。
 * 既にあるメールアドレスを指定したときは、初期パスワードを発行し直す（--reset を付けたときだけ）。
 */
import { createDb } from "@mirai-gikai/db";
import { eq, sql } from "@mirai-gikai/db/orm";
import { user_sessions, users } from "@mirai-gikai/db/schema";
import { generateInitialPassword } from "@mirai-gikai/shared/auth/initial-password";

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("使い方: pnpm admin:create <メールアドレス> [--reset]");
  }

  const db = createDb();
  const password = generateInitialPassword();
  const hash = sql`crypt(${password}, gen_salt('bf'))`;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`);

  if (existing) {
    if (!reset) {
      throw new Error(
        `${email} は既にあります。初期パスワードを発行し直すときは --reset を付けてください`
      );
    }
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ password_hash: hash, must_change_password: true, is_super_admin: true })
        .where(eq(users.id, existing.id));
      await tx.delete(user_sessions).where(eq(user_sessions.user_id, existing.id));
    });
    console.log(`🔑 ${email} の初期パスワードを発行し直しました`);
  } else {
    await db.insert(users).values({
      email,
      password_hash: hash,
      is_super_admin: true,
      must_change_password: true,
    });
    console.log(`✅ 全体管理者 ${email} を作りました`);
  }
  console.log(`   初期パスワード: ${password}`);
  console.log("   （この表示は1度だけです。初回ログインで変更してください）");
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
