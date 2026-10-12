import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillTag } from "../../shared/types";
import { findFeaturedTags } from "../repositories/bill-repository";

/**
 * 絞り込みに出すタグ。featured_priority を持つタグを優先度順に返す（タグは全議会共通）。
 */
export async function getFeaturedTags(): Promise<BillTag[]> {
  return _getCachedFeaturedTags();
}

const _getCachedFeaturedTags = unstable_cache(
  async (): Promise<BillTag[]> => {
    const tags = await findFeaturedTags();

    // 取得失敗をキャッシュに載せない。例外はキャッシュされない。
    if (tags === null) {
      throw new Error("Failed to fetch featured tags");
    }

    return tags.map((tag) => ({ id: tag.id, label: tag.label }));
  },
  ["featured-tags"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
