import { and, eq } from "@mirai-gikai/db/orm";
import {
  assembly_factions,
  bill_faction_votes,
  bill_results,
  bills,
  sessions,
} from "@mirai-gikai/db/schema";
import {
  deleteDummyData,
  hasDummyData,
} from "@mirai-gikai/shared/csv-import/apply";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupTestAssembly,
  createTestAssembly,
  createTestBill,
  createTestSession,
  db,
} from "./utils";

describe("ダミーデータの確認と削除（hasDummyData / deleteDummyData）", () => {
  let assemblyId: string;

  beforeEach(async () => {
    assemblyId = (await createTestAssembly()).id;
  });

  afterEach(async () => {
    await cleanupTestAssembly(assemblyId);
  });

  it("ダミーが無ければ false", async () => {
    const session = await createTestSession(assemblyId);
    await createTestBill({ assembly_id: assemblyId, session_id: session.id });
    expect(await hasDummyData(db, assemblyId)).toBe(false);
  });

  it("ダミーの会期・議案・会派と議決結果を消し、実データは残す", async () => {
    const realSession = await createTestSession(assemblyId);
    const realBill = await createTestBill({
      assembly_id: assemblyId,
      session_id: realSession.id,
    });
    const dummySession = await createTestSession(assemblyId, {
      is_dummy: true,
    });
    const dummyBill = await createTestBill({
      assembly_id: assemblyId,
      session_id: dummySession.id,
      is_dummy: true,
    });
    const [dummyFaction] = await db
      .insert(assembly_factions)
      .values({
        assembly_id: assemblyId,
        name: "ダミー会派",
        valid_from: "2023-05-01",
        is_dummy: true,
      })
      .returning();
    await db
      .insert(bill_results)
      .values({ bill_id: dummyBill.id, result: "passed" });
    await db.insert(bill_faction_votes).values({
      bill_id: dummyBill.id,
      faction_id: dummyFaction.id,
      vote: "for",
    });
    expect(await hasDummyData(db, assemblyId)).toBe(true);

    const deleted = await db.transaction((tx) =>
      deleteDummyData(tx, assemblyId)
    );
    expect(deleted).toEqual({ sessionCount: 1, billCount: 1, factionCount: 1 });
    expect(await hasDummyData(db, assemblyId)).toBe(false);

    const remainingBills = await db
      .select({ id: bills.id })
      .from(bills)
      .where(eq(bills.assembly_id, assemblyId));
    expect(remainingBills).toEqual([{ id: realBill.id }]);
    const remainingSessions = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.assembly_id, assemblyId));
    expect(remainingSessions).toEqual([{ id: realSession.id }]);
    expect(
      await db
        .select()
        .from(bill_results)
        .where(eq(bill_results.bill_id, dummyBill.id))
    ).toEqual([]);
    expect(
      await db
        .select()
        .from(bill_faction_votes)
        .where(
          and(
            eq(bill_faction_votes.bill_id, dummyBill.id),
            eq(bill_faction_votes.faction_id, dummyFaction.id)
          )
        )
    ).toEqual([]);
  });
});
