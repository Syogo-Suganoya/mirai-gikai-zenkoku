import "server-only";

import { createDb } from "@mirai-gikai/db";
import { asc, eq } from "@mirai-gikai/db/orm";
import {
  assembly_factions,
  bill_faction_votes,
  bill_results,
} from "@mirai-gikai/db/schema";
import {
  deleteBillResult,
  replaceBillResult,
} from "@mirai-gikai/shared/bill-results/save";
import type {
  BillResultValue,
  FactionOption,
  FactionVoteValue,
  SavedBillResult,
} from "../../shared/types";

export async function findBillResult(
  billId: string
): Promise<SavedBillResult | null> {
  const db = createDb();
  const [[result], votes] = await Promise.all([
    db
      .select({
        result: bill_results.result,
        decided_on: bill_results.decided_on,
        yes_count: bill_results.yes_count,
        no_count: bill_results.no_count,
        source_url: bill_results.source_url,
      })
      .from(bill_results)
      .where(eq(bill_results.bill_id, billId)),
    db
      .select({
        faction_id: bill_faction_votes.faction_id,
        vote: bill_faction_votes.vote,
      })
      .from(bill_faction_votes)
      .where(eq(bill_faction_votes.bill_id, billId)),
  ]);
  return result ? { ...result, faction_votes: votes } : null;
}

/** 議会の会派（古いものから。議決日の時点で有効なものは画面側で選ぶ） */
export async function findAssemblyFactions(
  assemblyId: string
): Promise<FactionOption[]> {
  return createDb()
    .select({
      id: assembly_factions.id,
      name: assembly_factions.name,
      short_name: assembly_factions.short_name,
      valid_from: assembly_factions.valid_from,
      valid_to: assembly_factions.valid_to,
    })
    .from(assembly_factions)
    .where(eq(assembly_factions.assembly_id, assemblyId))
    .orderBy(asc(assembly_factions.valid_from), asc(assembly_factions.name));
}

export async function saveBillResultRecord(
  billId: string,
  value: BillResultValue,
  factionVotes: FactionVoteValue[] | null
) {
  await createDb().transaction((tx) =>
    replaceBillResult(tx, billId, value, factionVotes)
  );
}

export async function deleteBillResultRecord(billId: string) {
  await createDb().transaction((tx) => deleteBillResult(tx, billId));
}
