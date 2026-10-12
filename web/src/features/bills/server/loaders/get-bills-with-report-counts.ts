import "server-only";

import { countPublicReportsByBillIds } from "@mirai-gikai/shared/report-publication/count-public-reports";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillWithContent } from "../../shared/types";
import { getAssemblyBills } from "./get-assembly-bills";

/**
 * 回答数のキャッシュ。
 *
 * 議案一覧は searchParams と cookie を読むため毎リクエスト動的に描画される。
 * 素で集計すると、全公開レポートを走る集計クエリが絞り込みのクリックごとに走る。
 * 回答数は粗いバッジと並び替えのキーにしか使わないので、1分の遅れは体感に出ない。
 */
const getCachedReportCounts = unstable_cache(
  async (billIds: string[]) => {
    const counts = await countPublicReportsByBillIds(billIds);
    // unstable_cache は Map を返せないので配列で保存する。
    return [...counts.entries()];
  },
  ["bills-public-report-counts"],
  { revalidate: 60, tags: [CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS] }
);

/**
 * 一覧用に、公開レポート件数を添えた議会の議案を返す。
 * 0件の議案は集計結果に現れないため 0 を埋める。
 */
export async function getBillsWithReportCounts(
  assemblyId: string
): Promise<BillWithContent[]> {
  const bills = await getAssemblyBills(assemblyId);
  const counts = new Map(
    await getCachedReportCounts(bills.map((bill) => bill.id))
  );

  return bills.map((bill) => ({
    ...bill,
    publicReportCount: counts.get(bill.id) ?? 0,
  }));
}
