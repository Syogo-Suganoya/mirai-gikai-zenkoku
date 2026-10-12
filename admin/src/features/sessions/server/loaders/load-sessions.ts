import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import type { SessionWithBillCount } from "../../shared/types";
import { findSessionsWithBillCount } from "../repositories/session-repository";

/** excludeDummy: 実データを登録するフォームの選択肢では、ダミーの会期を出さない */
export async function loadSessions(
  assemblyId: string,
  options: { excludeDummy?: boolean } = {}
): Promise<SessionWithBillCount[]> {
  noStore();
  return findSessionsWithBillCount(assemblyId, options);
}
