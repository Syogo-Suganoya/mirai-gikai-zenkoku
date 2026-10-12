import "server-only";

import { unstable_cache } from "next/cache";
import { toDateString } from "@/features/sessions/shared/utils/pick-session";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getJapanTime } from "@/lib/utils/date";
import type { AssemblySummary } from "../../shared/types";
import { sortAssembliesForSelect } from "../../shared/utils/sort-assemblies";
import { findAssembliesWithPublishedBills } from "../repositories/assembly-repository";

/** 公開中の議案がある議会の一覧（議会選択画面） */
export async function getAssemblySummaries(): Promise<AssemblySummary[]> {
  const today = toDateString(getJapanTime());
  return _getCached(today);
}

const _getCached = unstable_cache(
  async (today: string): Promise<AssemblySummary[]> => {
    const rows = await findAssembliesWithPublishedBills(today);
    return sortAssembliesForSelect(
      rows.map(({ realBillCount, ...row }) => ({
        ...row,
        dummyOnly: realBillCount === 0,
      }))
    );
  },
  ["assembly-summaries"],
  { revalidate: 600, tags: [CACHE_TAGS.ASSEMBLIES, CACHE_TAGS.BILLS] }
);
