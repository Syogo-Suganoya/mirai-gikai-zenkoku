import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ComingSoonBill } from "../../shared/types";
import { findComingSoonBills } from "../repositories/bill-repository";

/**
 * Coming Soon議案を取得する
 * publish_status = 'coming_soon' の議案。会期を渡せばその会期に絞る。
 */
export async function getComingSoonBills(
  assemblyId: string,
  sessionId: string | null
): Promise<ComingSoonBill[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  try {
    return await _getCachedComingSoonBills(
      assemblyId,
      difficultyLevel,
      sessionId
    );
  } catch (error) {
    console.error("Failed to fetch coming soon bills:", error);
    return [];
  }
}

const _getCachedComingSoonBills = unstable_cache(
  async (
    assemblyId: string,
    difficultyLevel: DifficultyLevelEnum,
    sessionId: string | null
  ): Promise<ComingSoonBill[]> => {
    const data = await findComingSoonBills(assemblyId, sessionId);

    return data.map((bill) => {
      // ユーザーが選択した難易度のコンテンツを優先し、なければ normal、任意の順に使う
      const contents = bill.bill_contents;
      const preferred = contents.find(
        (c) => c.difficulty_level === difficultyLevel
      );
      const fallback =
        contents.find((c) => c.difficulty_level === "normal") ?? contents[0];

      return {
        id: bill.id,
        name: bill.name,
        title: preferred?.title || fallback?.title || null,
        source_url: bill.source_url,
      };
    });
  },
  ["coming-soon-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
