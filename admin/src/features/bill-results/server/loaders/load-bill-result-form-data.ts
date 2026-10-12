import "server-only";

import {
  findAssemblyFactions,
  findBillResult,
} from "../repositories/bill-result-repository";

/** 議決結果の入力欄に出す、保存済みの結果と議会の会派 */
export async function loadBillResultFormData(
  billId: string,
  assemblyId: string
) {
  const [saved, factions] = await Promise.all([
    findBillResult(billId),
    findAssemblyFactions(assemblyId),
  ]);
  return { saved, factions };
}
