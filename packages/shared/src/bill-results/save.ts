/**
 * 議案の議決結果と会派ごとの賛否を保存する（管理画面の議案ごとの入力から使う）。
 * CSV 取り込みは空欄で既存の値を消さない（csv-import/apply.ts）が、こちらは入力どおりに置き換える。
 */

import type { Tx } from "@mirai-gikai/db";
import { eq, sql } from "@mirai-gikai/db/orm";
import {
  bill_faction_votes,
  bill_results,
  bills,
} from "@mirai-gikai/db/schema";
import { statusForResult } from "../csv-import/normalize";
import type { BillResult, FactionVote } from "../csv-import/types";

export type BillResultValue = {
  result: BillResult;
  decided_on: string | null;
  yes_count: number | null;
  no_count: number | null;
  source_url: string | null;
};

export type FactionVoteValue = { faction_id: string; vote: FactionVote };

/**
 * 議決結果を保存し、議案の状態を「議決済み」（継続審査・撤回はそれぞれの状態）にする。
 * factionVotes が null のときは会派ごとの賛否に触れない（粒度が会派別より粗い議会）。
 */
export async function replaceBillResult(
  tx: Tx,
  billId: string,
  value: BillResultValue,
  factionVotes: FactionVoteValue[] | null
): Promise<void> {
  await tx
    .insert(bill_results)
    .values({ bill_id: billId, ...value })
    .onConflictDoUpdate({
      target: bill_results.bill_id,
      set: { ...value, updated_at: sql`now()` },
    });
  await tx
    .update(bills)
    .set({ status: statusForResult(value.result) })
    .where(eq(bills.id, billId));

  if (factionVotes === null) return;
  await tx
    .delete(bill_faction_votes)
    .where(eq(bill_faction_votes.bill_id, billId));
  if (factionVotes.length > 0) {
    await tx
      .insert(bill_faction_votes)
      .values(factionVotes.map((v) => ({ bill_id: billId, ...v })));
  }
}

/** 議決結果と会派ごとの賛否を消す。議案の状態はそのまま（基本情報の画面で直す） */
export async function deleteBillResult(tx: Tx, billId: string): Promise<void> {
  await tx
    .delete(bill_faction_votes)
    .where(eq(bill_faction_votes.bill_id, billId));
  await tx.delete(bill_results).where(eq(bill_results.bill_id, billId));
}
