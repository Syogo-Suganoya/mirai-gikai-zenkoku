import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { routes } from "@/lib/routes";
import { getOrigin } from "@/lib/utils/url";
import { type BillWithContent, billKey } from "../../shared/types";

/**
 * シェアURLを生成
 */
export function createBillShareUrl(
  origin: string,
  billPath: string,
  difficulty: DifficultyLevelEnum
): string {
  return `${origin}${billPath}?difficulty=${difficulty}`;
}

/**
 * シェアメッセージを生成
 */
export function createShareMessage(
  bill: Pick<BillWithContent, "name" | "bill_content" | "is_dummy">
): string {
  const displayTitle = bill.bill_content?.title ?? bill.name;
  // ダミーの議案は、共有された先でも架空だと分かるようにする（8.5.3節）
  const title =
    bill.is_dummy && !displayTitle.includes(DUMMY_MARK)
      ? `${DUMMY_MARK}${displayTitle}`
      : displayTitle;
  return `${title} #地方議会`;
}

const DUMMY_MARK = "【ダミー】";

/**
 * シェアに必要なコンテキスト情報を取得
 */
export async function getShareContext(): Promise<{
  origin: string;
  difficulty: DifficultyLevelEnum;
}> {
  const [origin, difficulty] = await Promise.all([
    getOrigin(),
    getDifficultyLevel(),
  ]);

  return { origin, difficulty };
}

/**
 * 議案のシェアに必要なすべてのデータを取得
 */
export async function getBillShareData(bill: BillWithContent) {
  const { origin, difficulty } = await getShareContext();

  return {
    shareUrl: createBillShareUrl(
      origin,
      routes.billDetail(bill.assembly_slug, billKey(bill)),
      difficulty
    ),
    shareMessage: createShareMessage(bill),
    // シェア用OGP画像を優先的に使用、なければ通常のサムネイル
    thumbnailUrl: bill.share_thumbnail_url || bill.thumbnail_url,
  };
}
