import "server-only";

import { unstable_cache } from "next/cache";
import { getSessionsByAssembly } from "@/features/sessions/server/loaders/get-sessions";
import type { Session } from "@/features/sessions/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { countPublishedBillsBySession } from "../repositories/bill-repository";

export type SessionWithBillCount = {
  session: Session;
  billCount: number;
};

/**
 * 議会の会期と、各会期の公開議案数を新しい順に取得する。
 * 公開議案が0件の会期はリンク先が空になるため除外する。
 * excludeSessionId（議会トップで中心に出している会期）は除く。
 */
export async function getSessionsWithBillCount(
  assemblyId: string,
  excludeSessionId?: string | null
): Promise<SessionWithBillCount[]> {
  try {
    const [sessions, counts] = await Promise.all([
      getSessionsByAssembly(assemblyId),
      _getCachedCounts(assemblyId),
    ]);
    const countMap = new Map(counts);
    return sessions
      .filter((session) => session.id !== excludeSessionId)
      .map((session) => ({ session, billCount: countMap.get(session.id) ?? 0 }))
      .filter(({ billCount }) => billCount > 0);
  } catch (error) {
    console.error("Failed to fetch sessions with bill count:", error);
    return [];
  }
}

const _getCachedCounts = unstable_cache(
  async (assemblyId: string) => [
    ...(await countPublishedBillsBySession(assemblyId)).entries(),
  ],
  ["published-bill-count-by-session"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
