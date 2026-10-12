import { unstable_cache } from "next/cache";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { hideUnpublishedStance } from "../../shared/utils/hide-unpublished-stance";
import { toBillWithContent } from "../../shared/utils/to-bill-with-content";
import {
  findMiraiStanceByBillId,
  findPublishedBillByKey,
  findTagsByBillId,
} from "../repositories/bill-repository";
import { getBillContentWithDifficulty } from "./helpers/get-bill-content";

/**
 * 公開済みの議案を取得する。
 * key は議案の slug か id。slug は議会の中でだけ一意なので、ページからは assemblyId も渡す。
 */
export async function getBillById(
  key: string,
  assemblyId?: string
): Promise<BillWithContent | null> {
  // キャッシュ外でcookiesにアクセス
  const difficultyLevel = await getDifficultyLevel();
  const bill = await _getCachedBillById(
    decodeURIComponent(key),
    assemblyId ?? null,
    difficultyLevel
  );
  // 賛否の予約公開はキャッシュ（10分）の外で判定し、公開日時ちょうどに切り替える
  return bill ? hideUnpublishedStance(bill, new Date()) : null;
}

const _getCachedBillById = unstable_cache(
  async (
    key: string,
    assemblyId: string | null,
    difficultyLevel: DifficultyLevelEnum
  ): Promise<BillWithContent | null> => {
    const bill = await findPublishedBillByKey(key, assemblyId ?? undefined);
    if (!bill) {
      return null;
    }

    // 見解・コンテンツ・タグを並列取得
    // 見解は公開日時前のものも含めてキャッシュし、呼び出し側で除外する
    const [miraiStance, billContent, billTags] = await Promise.all([
      findMiraiStanceByBillId(bill.id),
      getBillContentWithDifficulty(bill.id, difficultyLevel),
      findTagsByBillId(bill.id),
    ]);

    return {
      ...toBillWithContent(bill, { tags: billTags.map((bt) => bt.tags) }),
      mirai_stance: miraiStance || undefined,
      bill_content: billContent || undefined,
    };
  },
  ["bill-by-id"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.BILLS],
  }
);
