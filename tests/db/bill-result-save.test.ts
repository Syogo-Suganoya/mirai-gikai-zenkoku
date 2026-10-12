import { eq } from "@mirai-gikai/db/orm";
import {
  assembly_factions,
  bill_faction_votes,
  bill_results,
  bills,
} from "@mirai-gikai/db/schema";
import {
  deleteBillResult,
  replaceBillResult,
} from "@mirai-gikai/shared/bill-results/save";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupTestBill, createTestBill, db } from "./utils";

describe("議決結果の保存（replaceBillResult / deleteBillResult）", () => {
  let billId: string;
  let factionIds: string[];

  beforeEach(async () => {
    const bill = await createTestBill();
    billId = bill.id;
    const factions = await db
      .insert(assembly_factions)
      .values([
        {
          assembly_id: bill.assembly_id,
          name: "会派A",
          valid_from: "2023-05-01",
        },
        {
          assembly_id: bill.assembly_id,
          name: "会派B",
          valid_from: "2023-05-01",
        },
      ])
      .returning({ id: assembly_factions.id });
    factionIds = factions.map((f) => f.id);
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
  });

  const findResult = async () =>
    (
      await db
        .select()
        .from(bill_results)
        .where(eq(bill_results.bill_id, billId))
    )[0];
  const findVotes = () =>
    db
      .select({
        faction_id: bill_faction_votes.faction_id,
        vote: bill_faction_votes.vote,
      })
      .from(bill_faction_votes)
      .where(eq(bill_faction_votes.bill_id, billId));
  const findStatus = async () =>
    (
      await db
        .select({ status: bills.status })
        .from(bills)
        .where(eq(bills.id, billId))
    )[0].status;

  it("結果と会派ごとの賛否を保存し、議案を議決済みにする", async () => {
    await db.transaction((tx) =>
      replaceBillResult(
        tx,
        billId,
        {
          result: "passed",
          decided_on: "2026-09-25",
          yes_count: 40,
          no_count: 8,
          source_url: null,
        },
        [
          { faction_id: factionIds[0], vote: "for" },
          { faction_id: factionIds[1], vote: "against" },
        ]
      )
    );
    expect(await findResult()).toMatchObject({
      result: "passed",
      decided_on: "2026-09-25",
      yes_count: 40,
      no_count: 8,
    });
    expect(await findVotes()).toHaveLength(2);
    expect(await findStatus()).toBe("decided");
  });

  it("入力どおりに置き換える（空欄は消える・外した会派の賛否も消える）", async () => {
    await db.transaction((tx) =>
      replaceBillResult(
        tx,
        billId,
        {
          result: "passed",
          decided_on: "2026-09-25",
          yes_count: 40,
          no_count: 8,
          source_url: "https://example.jp",
        },
        [
          { faction_id: factionIds[0], vote: "for" },
          { faction_id: factionIds[1], vote: "against" },
        ]
      )
    );
    await db.transaction((tx) =>
      replaceBillResult(
        tx,
        billId,
        {
          result: "continued",
          decided_on: null,
          yes_count: null,
          no_count: null,
          source_url: null,
        },
        [{ faction_id: factionIds[1], vote: "split" }]
      )
    );
    expect(await findResult()).toMatchObject({
      result: "continued",
      decided_on: null,
      yes_count: null,
      no_count: null,
      source_url: null,
    });
    expect(await findVotes()).toEqual([
      { faction_id: factionIds[1], vote: "split" },
    ]);
    expect(await findStatus()).toBe("continued");
  });

  it("会派ごとの賛否が null なら既存の賛否に触れない", async () => {
    await db.transaction((tx) =>
      replaceBillResult(
        tx,
        billId,
        {
          result: "passed",
          decided_on: null,
          yes_count: null,
          no_count: null,
          source_url: null,
        },
        [{ faction_id: factionIds[0], vote: "for" }]
      )
    );
    await db.transaction((tx) =>
      replaceBillResult(
        tx,
        billId,
        {
          result: "withdrawn",
          decided_on: null,
          yes_count: null,
          no_count: null,
          source_url: null,
        },
        null
      )
    );
    expect(await findVotes()).toHaveLength(1);
    expect(await findStatus()).toBe("withdrawn");
  });

  it("削除すると結果と賛否が消え、議案の状態はそのまま", async () => {
    await db.transaction((tx) =>
      replaceBillResult(
        tx,
        billId,
        {
          result: "rejected",
          decided_on: null,
          yes_count: null,
          no_count: null,
          source_url: null,
        },
        [{ faction_id: factionIds[0], vote: "against" }]
      )
    );
    await db.transaction((tx) => deleteBillResult(tx, billId));
    expect(await findResult()).toBeUndefined();
    expect(await findVotes()).toEqual([]);
    expect(await findStatus()).toBe("decided");
  });
});
