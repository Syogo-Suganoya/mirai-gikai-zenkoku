import "server-only";

import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { toBillWithContent } from "../../shared/utils/to-bill-with-content";
import {
  findBillIdsWithPublicInterview,
  findPublishedBills,
  type PublishedBillFilter,
} from "../repositories/bill-repository";

type BillQuery = Omit<PublishedBillFilter, "assemblyId">;

/**
 * 議会の公開済み議案（解説・タグ・議決結果・インタビュー受付中の印付き）。
 * 議会トップ・会期ページ・議案一覧で共通に使う。
 */
export async function getAssemblyBills(
  assemblyId: string,
  query: BillQuery = {}
): Promise<BillWithContent[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  return _getCachedAssemblyBills(assemblyId, difficultyLevel, query);
}

const _getCachedAssemblyBills = unstable_cache(
  async (
    assemblyId: string,
    difficultyLevel: DifficultyLevelEnum,
    query: BillQuery
  ): Promise<BillWithContent[]> => {
    const rows = await findPublishedBills(difficultyLevel, {
      ...query,
      assemblyId,
    });
    const interviewBillIds = await findBillIdsWithPublicInterview(
      rows.map((row) => row.id)
    );
    return rows.map((row) =>
      toBillWithContent(row, {
        hasPublicInterview: interviewBillIds.has(row.id),
      })
    );
  },
  ["assembly-bills"],
  {
    revalidate: 600, // 10分
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
