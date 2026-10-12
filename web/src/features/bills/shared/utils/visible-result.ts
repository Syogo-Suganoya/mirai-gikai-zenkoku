import type { BillResultRow, VoteGranularity } from "../types";

/** 議会設定の議決結果の粒度に応じて、公開側に出す項目 */
export type VisibleResultFields = {
  /** 結果（可決・否決など）と議決日 */
  result: boolean;
  /** 賛成数・反対数 */
  counts: boolean;
  /** 会派ごとの賛否 */
  factions: boolean;
};

/**
 * 粒度ごとに出す項目を決める（v2 2.2節）。
 * 「非公開」の議会は結果も出さない。データが無い項目は出さない（v2 2.7節）。
 */
export function visibleResultFields(
  granularity: VoteGranularity,
  result: Pick<BillResultRow, "yes_count" | "no_count"> | null | undefined,
  factionVoteCount: number
): VisibleResultFields {
  if (granularity === "unpublished" || !result) {
    return { result: false, counts: false, factions: false };
  }
  const hasCounts = result.yes_count !== null || result.no_count !== null;
  const countsAllowed = granularity !== "result_only";
  const factionsAllowed = granularity === "faction" || granularity === "member";
  return {
    result: true,
    counts: countsAllowed && hasCounts,
    factions: factionsAllowed && factionVoteCount > 0,
  };
}
