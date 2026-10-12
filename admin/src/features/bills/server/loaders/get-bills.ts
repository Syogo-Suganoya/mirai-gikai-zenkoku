import type { BillSortConfig, BillWithSession } from "../../shared/types";
import { findBillsWithSessionsByAssembly } from "../repositories/bill-repository";

export async function getBills(
  assemblyId: string,
  sortConfig?: BillSortConfig
): Promise<BillWithSession[]> {
  return findBillsWithSessionsByAssembly(assemblyId, sortConfig);
}
