import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  type BillCategoryCount,
  toBillCategoryCounts,
} from "../../shared/utils/bill-category";
import { countPublishedBillsByCategory } from "../repositories/bill-repository";

/**
 * 議会の公開議案を種類ごとに数える（0件の種類は除く）。
 * 議案一覧（/[assembly]/bills）と同じく全会期を数えるので、タブを押した先の件数と一致する。
 */
export async function getBillCategoryCounts(
  assemblyId: string
): Promise<BillCategoryCount[]> {
  try {
    const rows = await _getCachedCounts(assemblyId);
    return toBillCategoryCounts(
      Object.fromEntries(rows.map((r) => [r.category, r.count]))
    );
  } catch (error) {
    console.error("Failed to count bills by category:", error);
    return [];
  }
}

const _getCachedCounts = unstable_cache(
  countPublishedBillsByCategory,
  ["published-bill-count-by-category"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
