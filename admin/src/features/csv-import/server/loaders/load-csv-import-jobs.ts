import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import type { CsvImportJobSummary } from "../../shared/types";
import { findJobsByAssembly } from "../repositories/csv-import-repository";

/** 取り込みの履歴（assemblyId が null なら議会マスタの取り込み） */
export async function loadCsvImportJobs(
  assemblyId: string | null
): Promise<CsvImportJobSummary[]> {
  noStore();
  return findJobsByAssembly(assemblyId);
}
