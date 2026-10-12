import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { Session } from "../../shared/types";
import {
  findSessionBySlug,
  findSessionsByAssembly,
} from "../repositories/session-repository";

/** 議会の会期（新しい順） */
export async function getSessionsByAssembly(
  assemblyId: string
): Promise<Session[]> {
  return _getCachedSessions(assemblyId);
}

const _getCachedSessions = unstable_cache(
  async (assemblyId: string) => findSessionsByAssembly(assemblyId),
  ["sessions-by-assembly"],
  { revalidate: 3600, tags: [CACHE_TAGS.SESSIONS] }
);

/** 議会内のスラッグで会期を取得する */
export async function getSessionBySlug(
  assemblyId: string,
  slug: string
): Promise<Session | null> {
  return _getCachedSessionBySlug(assemblyId, decodeURIComponent(slug));
}

const _getCachedSessionBySlug = unstable_cache(
  async (assemblyId: string, slug: string) =>
    findSessionBySlug(assemblyId, slug),
  ["session-by-slug"],
  { revalidate: 3600, tags: [CACHE_TAGS.SESSIONS] }
);
