import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findReviewer } from "../repositories/bill-repository";

export type BillReviewer = { display_name: string; affiliation: string };

/** 解説を確認した人（確認者が登録されていなければ null） */
export async function getBillReviewer(
  assemblyId: string,
  reviewedBy: string | null
): Promise<BillReviewer | null> {
  if (!reviewedBy) return null;
  return _getCached(assemblyId, reviewedBy);
}

const _getCached = unstable_cache(
  async (assemblyId: string, userId: string) =>
    findReviewer(assemblyId, userId),
  ["bill-reviewer"],
  { revalidate: 600, tags: [CACHE_TAGS.ASSEMBLIES] }
);
