import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, count, desc, eq, sql } from "@mirai-gikai/db/orm";
import { bills, sessions } from "@mirai-gikai/db/schema";
import {
  deleteDummyData,
  hasDummyData,
} from "@mirai-gikai/shared/csv-import/apply";
import {
  DummyDataExistsError,
  decideDummyHandling,
} from "@mirai-gikai/shared/csv-import/dummy-handling";
import type { SessionInput, SessionWithBillCount } from "../../shared/types";

/** 議会の会期（新しい順）と、それぞれの議案数 */
export async function findSessionsWithBillCount(
  assemblyId: string,
  options: { excludeDummy?: boolean } = {}
): Promise<SessionWithBillCount[]> {
  const rows = await createDb()
    .select({ session: sessions, billCount: count(bills.id) })
    .from(sessions)
    .leftJoin(bills, eq(bills.session_id, sessions.id))
    .where(
      and(
        eq(sessions.assembly_id, assemblyId),
        options.excludeDummy ? eq(sessions.is_dummy, false) : undefined
      )
    )
    .groupBy(sessions.id)
    .orderBy(desc(sessions.start_date));
  return rows.map((row) => ({ ...row.session, billCount: row.billCount }));
}

/**
 * 会期を追加する。議会にダミーデータが残っていれば、同意（deleteDummyData）があるときだけ
 * 消してから追加する。同意がなければ DummyDataExistsError を投げる。
 */
export async function insertSession(
  assemblyId: string,
  input: SessionInput,
  options: { deleteDummyData?: boolean } = {}
) {
  return createDb().transaction(async (tx) => {
    const handling = decideDummyHandling(
      await hasDummyData(tx, assemblyId),
      options.deleteDummyData ?? false
    );
    if (handling === "reject") throw new DummyDataExistsError();
    if (handling === "delete") await deleteDummyData(tx, assemblyId);

    const [row] = await tx
      .insert(sessions)
      .values({ assembly_id: assemblyId, ...input })
      .returning();
    return row;
  });
}

export async function updateSession(
  assemblyId: string,
  id: string,
  input: SessionInput
) {
  const [row] = await createDb()
    .update(sessions)
    .set({ ...input, updated_at: sql`now()` })
    .where(and(eq(sessions.id, id), eq(sessions.assembly_id, assemblyId)))
    .returning();
  return row ?? null;
}

/** 議案がある会期は消せない（議案ごと消えるのを防ぐ）。消せたら true */
export async function deleteSessionWithoutBills(
  assemblyId: string,
  id: string
) {
  const deleted = await createDb()
    .delete(sessions)
    .where(
      and(
        eq(sessions.id, id),
        eq(sessions.assembly_id, assemblyId),
        sql`not exists (select 1 from ${bills} where ${bills.session_id} = ${sessions.id})`
      )
    )
    .returning({ id: sessions.id });
  return deleted.length > 0;
}
