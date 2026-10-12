import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import {
  type CurrentUser,
  requireUser,
  requireUserPage,
} from "@/features/auth/server/lib/session";
import type { AssemblyContext } from "../../shared/types";
import { findAssemblyWithSettingsBySlug } from "../repositories/assembly-repository";

/**
 * 議会のページ（/[assembly]/...）の先頭で呼ぶ。ログインしていればすべての議会を扱える。
 * 議会が無ければ 404。
 */
export const requireAssemblyPage = cache(
  async (slug: string): Promise<AssemblyContext> => {
    await requireUserPage();
    const context = await findAssemblyWithSettingsBySlug(slug);
    if (!context) notFound();
    return context;
  }
);

/** Server Action 用。ログインしていなければ・議会が無ければエラーを投げる */
export async function requireAssemblyAction(
  slug: string
): Promise<AssemblyContext & { user: CurrentUser }> {
  const user = await requireUser();
  const context = await findAssemblyWithSettingsBySlug(slug);
  if (!context) throw new Error("議会が見つかりません");
  return { ...context, user };
}
