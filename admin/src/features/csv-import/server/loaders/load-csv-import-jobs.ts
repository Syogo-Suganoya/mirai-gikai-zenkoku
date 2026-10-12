import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import type { CsvImportJobSummary } from "../../shared/types";
import { findJobsByAssembly } from "../repositories/csv-import-repository";

export async function loadCsvImportJobs(
  assemblyId: string
): Promise<CsvImportJobSummary[]> {
  noStore();
  return findJobsByAssembly(assemblyId);
}
