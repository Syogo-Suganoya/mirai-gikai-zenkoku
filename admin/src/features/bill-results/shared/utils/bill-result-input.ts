import { factionsActiveOn } from "@mirai-gikai/shared/bill-results/factions";
import {
  normalizeInteger,
  normalizeUrl,
} from "@mirai-gikai/shared/csv-import/normalize";
import type { VoteGranularity } from "@/features/assemblies/shared/types";
import type {
  BillResultFormValues,
  BillResultValue,
  FactionOption,
  FactionVoteValue,
  SavedBillResult,
} from "../types";

/** 議会設定の粒度に応じて出す入力欄（設計 v3 6.1節） */
export type BillResultInputFields = {
  /** 賛成数・反対数 */
  counts: boolean;
  /** 会派ごとの賛否（議員ごとの内訳は扱わないので「議員別」も会派まで） */
  factions: boolean;
};

export function billResultInputFields(
  granularity: VoteGranularity
): BillResultInputFields {
  return {
    counts:
      granularity === "count" ||
      granularity === "faction" ||
      granularity === "member",
    factions: granularity === "faction" || granularity === "member",
  };
}

/** 会派の賛否を聞く基準日（議決日。未入力なら今日） */
export function factionReferenceDate(decidedOn: string, today: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(decidedOn) ? decidedOn : today;
}

/** 保存済みの値を入力欄の値にする */
export function toBillResultFormValues(
  saved: SavedBillResult | null
): BillResultFormValues {
  return {
    result: saved?.result ?? "",
    decided_on: saved?.decided_on ?? "",
    yes_count: saved?.yes_count?.toString() ?? "",
    no_count: saved?.no_count?.toString() ?? "",
    source_url: saved?.source_url ?? "",
    faction_votes: Object.fromEntries(
      (saved?.faction_votes ?? []).map((v) => [v.faction_id, v.vote])
    ),
  };
}

export type BillResultInputParse =
  | {
      ok: true;
      value: BillResultValue;
      /** null のときは会派ごとの賛否に触れない */
      factionVotes: FactionVoteValue[] | null;
    }
  | { ok: false; error: string };

/**
 * 入力を検証して保存する値にする。
 * 粒度で出していない欄の値は使わない（票数は null、会派ごとの賛否は触れない）。
 */
export function parseBillResultInput(
  values: BillResultFormValues,
  context: {
    granularity: VoteGranularity;
    factions: readonly FactionOption[];
    today: string;
  }
): BillResultInputParse {
  const fields = billResultInputFields(context.granularity);
  if (values.result === "") {
    return { ok: false, error: "結果を選んでください" };
  }

  const decidedOn = values.decided_on.trim();
  if (decidedOn !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(decidedOn)) {
    return { ok: false, error: "議決日の形式が正しくありません" };
  }

  const yesCount = fields.counts ? normalizeInteger(values.yes_count) : null;
  const noCount = fields.counts ? normalizeInteger(values.no_count) : null;
  if (yesCount === undefined || noCount === undefined) {
    return {
      ok: false,
      error: "賛成数・反対数は 0 以上の整数で入力してください",
    };
  }

  const sourceUrl = normalizeUrl(values.source_url);
  if (sourceUrl === undefined) {
    return {
      ok: false,
      error: "出典は http:// か https:// で始まる URL を入力してください",
    };
  }

  let factionVotes: FactionVoteValue[] | null = null;
  if (fields.factions) {
    const on = factionReferenceDate(decidedOn, context.today);
    const activeIds = new Set(
      factionsActiveOn(context.factions, on).map((f) => f.id)
    );
    factionVotes = [];
    for (const [factionId, vote] of Object.entries(values.faction_votes)) {
      if (vote === "") continue;
      if (!activeIds.has(factionId)) {
        return {
          ok: false,
          error: `議決日（${on}）の時点で有効でない会派の賛否が入っています`,
        };
      }
      factionVotes.push({ faction_id: factionId, vote });
    }
  }

  return {
    ok: true,
    value: {
      result: values.result,
      decided_on: decidedOn === "" ? null : decidedOn,
      yes_count: yesCount,
      no_count: noCount,
      source_url: sourceUrl,
    },
    factionVotes,
  };
}
