import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import type { AssemblyListItem } from "../../shared/types";
import { findAssembliesWithBillCounts } from "../repositories/assembly-repository";

/** すべての議会（管理者は全員、すべての議会を扱える） */
export async function loadAssemblies(): Promise<AssemblyListItem[]> {
  noStore();
  return findAssembliesWithBillCounts();
}
