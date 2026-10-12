import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillsByTag } from "../../shared/types";
import { toBillWithContent } from "../../shared/utils/to-bill-with-content";
import {
  findBillIdsWithPublicInterview,
  findFeaturedTags,
  findPublishedBills,
} from "../repositories/bill-repository";

/**
 * Featured表示用の議案をタグごとにグループ化して取得
 * featured_priority が設定されているタグを持つ議会の議案を優先度順に取得する。
 * 会期を渡せばその会期に絞る。
 */
export async function getBillsByFeaturedTags(
  assemblyId: string,
  sessionId: string | null
): Promise<BillsByTag[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();

  try {
    return await _getCachedBillsByFeaturedTags(
      assemblyId,
      difficultyLevel,
      sessionId
    );
  } catch (error) {
    // 取得失敗はキャッシュ関数の外で受ける。中で空配列に変換すると、失敗が
    // 正常な結果として10分キャッシュされてしまう。
    console.error("Failed to fetch bills by featured tags:", error);
    return [];
  }
}

const _getCachedBillsByFeaturedTags = unstable_cache(
  async (
    assemblyId: string,
    difficultyLevel: DifficultyLevelEnum,
    sessionId: string | null
  ): Promise<BillsByTag[]> => {
    const featuredTags = await findFeaturedTags();

    // 取得失敗はキャッシュに載せない。
    if (featuredTags === null) {
      throw new Error("Failed to fetch featured tags");
    }

    const results = await Promise.all(
      featuredTags.map(async (tag) => {
        const rows = await findPublishedBills(difficultyLevel, {
          assemblyId,
          sessionId,
          tagId: tag.id,
        });
        if (rows.length === 0) return null;
        return {
          tag: {
            id: tag.id,
            label: tag.label,
            description: tag.description ?? undefined,
            priority: tag.featured_priority ?? -1,
          },
          bills: rows.map((row) => toBillWithContent(row)),
        };
      })
    );

    const filtered = results.filter(
      (result): result is NonNullable<typeof result> => result !== null
    );

    // 全議案のIDを収集してインタビュー状態を一括取得
    const interviewBillIds = await findBillIdsWithPublicInterview(
      filtered.flatMap((r) => r.bills.map((b) => b.id))
    );

    return filtered.map((result) => ({
      ...result,
      bills: result.bills.map((bill) => ({
        ...bill,
        hasPublicInterview: interviewBillIds.has(bill.id),
      })),
    }));
  },
  ["featured-tag-bills"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
