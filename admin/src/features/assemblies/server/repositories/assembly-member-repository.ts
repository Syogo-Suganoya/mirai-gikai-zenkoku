import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, asc, eq, sql } from "@mirai-gikai/db/orm";
import { assembly_members, users } from "@mirai-gikai/db/schema";
import type { AssemblyMember, AssemblyMemberInput } from "../../shared/types";

export async function findMembersByAssembly(
  assemblyId: string
): Promise<AssemblyMember[]> {
  return createDb()
    .select({
      user_id: assembly_members.user_id,
      email: users.email,
      role: assembly_members.role,
      display_name: assembly_members.display_name,
      affiliation: assembly_members.affiliation,
      must_change_password: users.must_change_password,
      last_login_at: users.last_login_at,
      created_at: assembly_members.created_at,
    })
    .from(assembly_members)
    .innerJoin(users, eq(users.id, assembly_members.user_id))
    .where(eq(assembly_members.assembly_id, assemblyId))
    .orderBy(asc(assembly_members.role), asc(assembly_members.created_at));
}

export async function findUserForMember(email: string) {
  const [row] = await createDb()
    .select({ id: users.id, is_super_admin: users.is_super_admin })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`);
  return row ?? null;
}

type MemberValues = Omit<AssemblyMemberInput, "email">;

/**
 * 担当者を追加する。アカウントが無ければ初期パスワードで作る（1トランザクション）。
 * 既に担当していれば一意制約違反になる。
 */
export async function insertMember(params: {
  assemblyId: string;
  invitedBy: string;
  values: MemberValues;
  user: { id: string } | { email: string; initialPassword: string };
}) {
  await createDb().transaction(async (tx) => {
    let userId: string;
    if ("id" in params.user) {
      userId = params.user.id;
    } else {
      const [created] = await tx
        .insert(users)
        .values({
          email: params.user.email,
          password_hash: sql`crypt(${params.user.initialPassword}, gen_salt('bf'))`,
          is_super_admin: false,
          must_change_password: true,
        })
        .returning({ id: users.id });
      userId = created.id;
    }
    await tx.insert(assembly_members).values({
      assembly_id: params.assemblyId,
      user_id: userId,
      invited_by: params.invitedBy,
      ...params.values,
    });
  });
}

export async function updateMember(
  assemblyId: string,
  userId: string,
  values: MemberValues
) {
  const updated = await createDb()
    .update(assembly_members)
    .set(values)
    .where(
      and(
        eq(assembly_members.assembly_id, assemblyId),
        eq(assembly_members.user_id, userId)
      )
    )
    .returning({ user_id: assembly_members.user_id });
  return updated.length > 0;
}

/** 議会の担当から外す（アカウントは残す。ほかの議会の担当や再割り当てのため） */
export async function deleteMember(assemblyId: string, userId: string) {
  await createDb()
    .delete(assembly_members)
    .where(
      and(
        eq(assembly_members.assembly_id, assemblyId),
        eq(assembly_members.user_id, userId)
      )
    );
}
