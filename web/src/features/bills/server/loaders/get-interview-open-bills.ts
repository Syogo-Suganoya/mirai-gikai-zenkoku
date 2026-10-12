import "server-only";

import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillContent, BillWithContent } from "../../shared/types";
import { toBillWithContent } from "../../shared/utils/to-bill-with-content";
import { findBillsWithPublicInterview } from "../repositories/bill-repository";

/**
 * AIインタビュー受付中の議案を取得する（議会トップの「AIインタビュー受付中」）。
 * 会期でも掲載タグでも絞らないので、受付中のものは漏れなくここに並ぶ。
 */
export async function getInterviewOpenBills(
  assemblyId: string
): Promise<BillWithContent[]> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();

  try {
    return await _getCachedInterviewOpenBills(assemblyId, difficultyLevel);
  } catch (error) {
    // 取得失敗はキャッシュ関数の外で受け、空に縮退させる。
    console.error("Failed to fetch interview open bills:", error);
    return [];
  }
}

const _getCachedInterviewOpenBills = unstable_cache(
  async (
    assemblyId: string,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent[]> => {
    const rows = await findBillsWithPublicInterview(
      assemblyId,
      difficultyLevel
    );
    // カードが使うのはタイトルと要約だけなので、解説本文（content）は引いていない。
    // ここで返す bill_content の content は参照しないこと。
    return rows.map((row) =>
      toBillWithContent(
        {
          ...row,
          bill_contents: row.bill_contents as unknown as BillContent[],
        },
        { hasPublicInterview: true }
      )
    );
  },
  ["interview-open-bills-list"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS, CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
