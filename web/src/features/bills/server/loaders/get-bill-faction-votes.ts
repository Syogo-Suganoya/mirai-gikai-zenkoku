import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { BillFactionVote } from "../../shared/types";
import { findFactionVotesByBillId } from "../repositories/bill-repository";

/** 議案の会派ごとの賛否（議決結果の粒度が会派別の議会で使う） */
export async function getBillFactionVotes(
  billId: string
): Promise<BillFactionVote[]> {
  return _getCached(billId);
}

const _getCached = unstable_cache(
  async (billId: string) => findFactionVotesByBillId(billId),
  ["bill-faction-votes"],
  { revalidate: 600, tags: [CACHE_TAGS.BILLS] }
);
