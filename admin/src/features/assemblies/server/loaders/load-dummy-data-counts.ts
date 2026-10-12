import "server-only";

import { countDummyData } from "../repositories/dummy-data-repository";

export function loadDummyDataCounts(assemblyId: string) {
  return countDummyData(assemblyId);
}
