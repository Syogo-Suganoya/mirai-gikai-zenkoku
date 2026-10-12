import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, eq, sql } from "@mirai-gikai/db/orm";
import { assembly_factions, bills, sessions } from "@mirai-gikai/db/schema";
import { deleteDummyData } from "@mirai-gikai/shared/csv-import/apply";
import type { DummyDataCounts } from "../../shared/utils/dummy-data-counts";

export async function countDummyData(
  assemblyId: string
): Promise<DummyDataCounts> {
  const db = createDb();
  const count = sql<number>`count(*)::int`;
  const [[s], [b], [f]] = await Promise.all([
    db
      .select({ count })
      .from(sessions)
      .where(
        and(eq(sessions.assembly_id, assemblyId), eq(sessions.is_dummy, true))
      ),
    db
      .select({ count })
      .from(bills)
      .where(and(eq(bills.assembly_id, assemblyId), eq(bills.is_dummy, true))),
    db
      .select({ count })
      .from(assembly_factions)
      .where(
        and(
          eq(assembly_factions.assembly_id, assemblyId),
          eq(assembly_factions.is_dummy, true)
        )
      ),
  ]);
  return { sessions: s.count, bills: b.count, factions: f.count };
}

/** 議会のダミーの会期・議案・会派をまとめて消す（議案の解説・議決結果なども cascade で消える） */
export async function deleteAssemblyDummyData(assemblyId: string) {
  return createDb().transaction((tx) => deleteDummyData(tx, assemblyId));
}
