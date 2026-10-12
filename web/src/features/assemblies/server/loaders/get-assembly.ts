import "server-only";

import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { AssemblyWithSettings } from "../../shared/types";
import { findAssemblyBySlug } from "../repositories/assembly-repository";

const _getCachedAssembly = unstable_cache(
  async (slug: string): Promise<AssemblyWithSettings | null> =>
    findAssemblyBySlug(slug),
  ["assembly-by-slug"],
  { revalidate: 600, tags: [CACHE_TAGS.ASSEMBLIES, CACHE_TAGS.BILLS] }
);

/** スラッグで議会を取得する（同じリクエスト内では1回だけ引く） */
export const getAssemblyBySlug = cache(
  async (slug: string): Promise<AssemblyWithSettings | null> =>
    _getCachedAssembly(decodeURIComponent(slug))
);

/** 議会を取得する。なければ 404 にする（ページ用） */
export async function requireAssembly(
  slug: string
): Promise<AssemblyWithSettings> {
  const assembly = await getAssemblyBySlug(slug);
  if (!assembly) notFound();
  return assembly;
}
