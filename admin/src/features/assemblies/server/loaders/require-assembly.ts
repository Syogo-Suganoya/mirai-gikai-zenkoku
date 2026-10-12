import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import {
  type CurrentUser,
  requireUser,
  requireUserPage,
} from "@/features/auth/server/lib/session";
import type { AssemblyAccessRole, AssemblyContext } from "../../shared/types";
import {
  hasAssemblyRole,
  resolveAssemblyRole,
} from "../../shared/utils/assembly-role";
import {
  findAssemblyMemberRole,
  findAssemblyWithSettingsBySlug,
} from "../repositories/assembly-repository";

async function loadAssemblyContext(
  user: CurrentUser,
  slug: string
): Promise<AssemblyContext | null> {
  const row = await findAssemblyWithSettingsBySlug(slug);
  if (!row) return null;
  const role = resolveAssemblyRole(
    user.is_super_admin,
    user.is_super_admin
      ? null
      : await findAssemblyMemberRole(row.assembly.id, user.id)
  );
  if (!role) return null;
  return { ...row, role };
}

/**
 * 議会のページ（/[assembly]/...）の先頭で呼ぶ。
 * 議会が無い・担当していない議会は 404 にする（議会があるかどうかも見せない）。
 */
export const requireAssemblyPage = cache(
  async (
    slug: string,
    required: AssemblyAccessRole = "editor"
  ): Promise<AssemblyContext> => {
    const user = await requireUserPage();
    const context = await loadAssemblyContext(user, slug);
    if (!context || !hasAssemblyRole(context.role, required)) notFound();
    return context;
  }
);

/** Server Action 用。権限が足りなければエラーを投げる */
export async function requireAssemblyAction(
  slug: string,
  required: AssemblyAccessRole = "editor"
): Promise<AssemblyContext & { user: CurrentUser }> {
  const user = await requireUser();
  const context = await loadAssemblyContext(user, slug);
  if (!context || !hasAssemblyRole(context.role, required)) {
    throw new Error("この議会を操作する権限がありません");
  }
  return { ...context, user };
}
