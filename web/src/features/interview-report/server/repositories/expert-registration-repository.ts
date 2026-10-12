import "server-only";

import { createDb } from "@mirai-gikai/db";
import { eq } from "@mirai-gikai/db/orm";
import { expert_registrations } from "@mirai-gikai/db/schema";

/**
 * 有識者登録を作成
 */
export async function createExpertRegistration(params: {
  userId: string;
  name: string;
  affiliation: string;
  email: string;
}) {
  const [row] = await createDb()
    .insert(expert_registrations)
    .values({
      user_id: params.userId,
      name: params.name,
      affiliation: params.affiliation,
      email: params.email,
    })
    .returning({ id: expert_registrations.id });
  return row;
}

/**
 * ユーザーIDで有識者登録が存在するか確認
 */
export async function findExpertRegistrationByUserId(userId: string) {
  const [row] = await createDb()
    .select({ id: expert_registrations.id })
    .from(expert_registrations)
    .where(eq(expert_registrations.user_id, userId))
    .limit(1);
  return row ?? null;
}

/**
 * メールアドレスで有識者登録が存在するか確認
 */
export async function findExpertRegistrationByEmail(email: string) {
  const [row] = await createDb()
    .select({ id: expert_registrations.id })
    .from(expert_registrations)
    .where(eq(expert_registrations.email, email))
    .limit(1);
  return row ?? null;
}
