import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { BillWithContent } from "../../shared/types";
import { toBillWithContent } from "../../shared/utils/to-bill-with-content";
import {
  findBillByKey,
  findMiraiStanceByBillId,
  findTagsByBillId,
} from "../repositories/bill-repository";
import { getBillContentWithDifficulty } from "./helpers/get-bill-content";

/**
 * 管理者用: 公開/非公開問わず議案を取得
 * プレビュー機能で使用
 * キャッシュなしで常に最新のデータを取得
 */
export async function getBillByIdAdmin(
  key: string,
  assemblyId?: string
): Promise<BillWithContent | null> {
  const difficultyLevel = await getDifficultyLevel();

  const bill = await findBillByKey(decodeURIComponent(key), assemblyId);
  if (!bill) {
    return null;
  }

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
}
