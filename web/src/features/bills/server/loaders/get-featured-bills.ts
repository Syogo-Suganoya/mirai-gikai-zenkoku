import type { BillWithContent } from "../../shared/types";
import { getAssemblyBills } from "./get-assembly-bills";

/**
 * 注目の議案を取得する
 * is_featured = true の公開済み議案。会期を渡せばその会期に絞る。
 */
export async function getFeaturedBills(
  assemblyId: string,
  sessionId: string | null
): Promise<BillWithContent[]> {
  try {
    return await getAssemblyBills(assemblyId, {
      featuredOnly: true,
      sessionId,
    });
  } catch (error) {
    console.error("Failed to fetch featured bills:", error);
    return [];
  }
}
