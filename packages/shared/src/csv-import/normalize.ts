/**
 * CSV のセルの表記ゆれを揃える純粋関数。
 * 値を解釈できないときは null を返し、エラーの文言は呼び出し側（validate）で作る。
 */

import type {
  AssemblyType,
  BillCategory,
  BillResult,
  BillStatus,
  FactionVote,
  SessionType,
} from "./types";

/** 全角の英数字・記号を半角にし、前後の空白を除く */
export function toHalfWidth(value: string): string {
  return value
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .trim();
}

const ERAS: Record<string, number> = {
  // 元年の前年（元年 = base + 1）
  令和: 2018,
  R: 2018,
  平成: 1988,
  H: 1988,
  昭和: 1925,
  S: 1925,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * 日付を YYYY-MM-DD にする。
 * 受け付ける形: 2026-09-01 / 2026/9/1 / 2026年9月1日 / R8.9.1 / R8/9/1 / 令和8年9月1日 / 令和元年5月1日（全角数字も可）
 */
export function normalizeDate(value: string): string | null {
  const v = toHalfWidth(value).replace(/\s/g, "");
  if (v === "") return null;

  const western = v.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (western) {
    return toIsoDate(Number(western[1]), Number(western[2]), Number(western[3]));
  }

  const era = v.match(
    /^(令和|平成|昭和|[RHS])(元|\d{1,2})[年./-](\d{1,2})[月./-](\d{1,2})日?$/i
  );
  if (era) {
    const base = ERAS[era[1].toUpperCase()] ?? ERAS[era[1]];
    if (base === undefined) return null;
    const eraYear = era[2] === "元" ? 1 : Number(era[2]);
    return toIsoDate(base + eraYear, Number(era[3]), Number(era[4]));
  }

  return null;
}

/** 議案番号の全角数字・空白のゆれを揃える（`議案第５２号` → `議案第52号`） */
export function normalizeBillNumber(value: string): string {
  return toHalfWidth(value).replace(/\s+/g, "");
}

/** 整数のセル（賛成数・議席数など）。空なら null、整数でなければ undefined */
export function normalizeInteger(value: string): number | null | undefined {
  const v = toHalfWidth(value).replace(/[,，人名票席]/g, "");
  if (v === "") return null;
  if (!/^\d+$/.test(v)) return undefined;
  return Number(v);
}

/** URL のセル。http(s) 以外は undefined */
export function normalizeUrl(value: string): string | null | undefined {
  const v = value.trim();
  if (v === "") return null;
  try {
    const url = new URL(v);
    return url.protocol === "http:" || url.protocol === "https:"
      ? v
      : undefined;
  } catch {
    return undefined;
  }
}

/** 議決結果の解釈。報告（議決されない）は別扱いにする */
export type BillResultParse =
  | { kind: "result"; value: BillResult }
  | { kind: "report" };

/** 表記と値の対応表 */
export const BILL_RESULT_ALIASES: Record<string, BillResult> = {
  可決: "passed",
  原案可決: "passed",
  可決及び認定: "passed",
  認定: "passed",
  同意: "passed",
  原案適任: "passed",
  適任: "passed",
  承認: "passed",
  "知事の裁決書（案）を適当と認める": "passed",
  異議なき旨の答申議決: "passed",
  修正可決: "amended",
  附帯決議を付して修正可決: "amended",
  否決: "rejected",
  不認定: "rejected",
  不同意: "rejected",
  不承認: "rejected",
  継続審査: "continued",
  閉会中継続審査: "continued",
  継続: "continued",
  撤回: "withdrawn",
  採択: "adopted",
  一部採択: "adopted",
  趣旨採択: "adopted",
  不採択: "not_adopted",
  passed: "passed",
  amended: "amended",
  rejected: "rejected",
  continued: "continued",
  withdrawn: "withdrawn",
  adopted: "adopted",
  not_adopted: "not_adopted",
};

/** 議決結果の表記ゆれを bill_result_enum にする */
export function normalizeBillResult(value: string): BillResultParse | null {
  const v = value.trim().replace(/\s/g, "").replace(/\(/g, "（").replace(/\)/g, "）");
  if (v === "") return null;
  if (v === "報告受理" || v === "報告" || v === "受理") return { kind: "report" };

  const exact = BILL_RESULT_ALIASES[v];
  if (exact) return { kind: "result", value: exact };

  // 「附帯決議を付して〜」のように前置きが付いたものは、含まれる語で判定する（否定形を先に見る）
  const contains: Array<[string, BillResult]> = [
    ["不採択", "not_adopted"],
    ["採択", "adopted"],
    ["修正可決", "amended"],
    ["否決", "rejected"],
    ["不認定", "rejected"],
    ["不同意", "rejected"],
    ["不承認", "rejected"],
    ["継続", "continued"],
    ["撤回", "withdrawn"],
    ["可決", "passed"],
    ["認定", "passed"],
    ["同意", "passed"],
    ["承認", "passed"],
  ];
  for (const [word, result] of contains) {
    if (v.includes(word)) return { kind: "result", value: result };
  }
  return null;
}

const FACTION_VOTE_ALIASES: Record<string, FactionVote> = {
  "○": "for",
  "〇": "for",
  "◯": "for",
  "◎": "for",
  賛成: "for",
  for: "for",
  "×": "against",
  "✕": "against",
  "✖": "against",
  "x": "against",
  "X": "against",
  反対: "against",
  against: "against",
  棄権: "abstain",
  abstain: "abstain",
  欠席: "absent",
  退席: "absent",
  absent: "absent",
  分かれた: "split",
  分裂: "split",
  一部賛成: "split",
  "△": "split",
  split: "split",
};

/**
 * 会派ごとの賛否の記号を faction_vote_enum にする。
 * 空欄・「-」は「記録なし」として undefined、解釈できなければ null。
 */
export function normalizeFactionVote(
  value: string
): FactionVote | null | undefined {
  const v = value.trim();
  if (v === "" || v === "-" || v === "－" || v === "―" || v === "ー") {
    return undefined;
  }
  return FACTION_VOTE_ALIASES[v] ?? null;
}

const CATEGORY_ALIASES: Record<string, BillCategory> = {
  予算: "budget",
  条例: "ordinance",
  人事: "personnel",
  契約: "contract",
  "請願・陳情": "petition",
  請願: "petition",
  陳情: "petition",
  報告: "report",
  その他: "other",
  budget: "budget",
  ordinance: "ordinance",
  personnel: "personnel",
  contract: "contract",
  petition: "petition",
  report: "report",
  other: "other",
};

export function normalizeCategory(value: string): BillCategory | null {
  return CATEGORY_ALIASES[value.trim().replace(/\s/g, "")] ?? null;
}

const STATUS_ALIASES: Record<string, BillStatus> = {
  準備中: "preparing",
  提出: "introduced",
  提出済み: "introduced",
  委員会付託: "referred_to_committee",
  付託: "referred_to_committee",
  審議中: "referred_to_committee",
  議決済み: "decided",
  議決: "decided",
  継続審査: "continued",
  撤回: "withdrawn",
  preparing: "preparing",
  introduced: "introduced",
  referred_to_committee: "referred_to_committee",
  decided: "decided",
  continued: "continued",
  withdrawn: "withdrawn",
};

export function normalizeBillStatus(value: string): BillStatus | null {
  return STATUS_ALIASES[value.trim()] ?? null;
}

export function normalizeSessionType(value: string): SessionType | null {
  const v = value.trim();
  if (/^(定例会|定例議会|定例|regular)$/.test(v)) return "regular";
  if (/^(臨時会|臨時議会|臨時|extraordinary)$/.test(v)) return "extraordinary";
  return null;
}

export function normalizeAssemblyType(value: string): AssemblyType | null {
  const v = value.trim();
  if (/^(都道府県|都|道|府|県|prefecture)$/.test(v)) return "prefecture";
  if (/^(市|city)$/.test(v)) return "city";
  if (/^(特別区|区|special_ward)$/.test(v)) return "special_ward";
  if (/^(町|town)$/.test(v)) return "town";
  if (/^(村|village)$/.test(v)) return "village";
  return null;
}

/**
 * 件名（と議決結果）から議案の種類を推定する（移行元の議案一覧には種類の列がないため）。
 * 「予算」→ 予算、「条例」→ 条例、選任・任命や結果が「同意」→ 人事、「契約」「取得」→ 契約、それ以外 → その他。
 */
export function inferBillCategory(
  name: string,
  result?: string | null
): BillCategory {
  if (name.includes("予算")) return "budget";
  if (name.includes("条例")) return "ordinance";
  if (/選任|任命|推薦/.test(name) || result?.trim() === "同意") {
    return "personnel";
  }
  if (/契約|取得/.test(name)) return "contract";
  if (/請願|陳情/.test(name)) return "petition";
  return "other";
}

/** 議決結果から議案の状態を決める（結果を取り込んだ議案の状態） */
export function statusForResult(result: BillResult): BillStatus {
  if (result === "continued") return "continued";
  if (result === "withdrawn") return "withdrawn";
  return "decided";
}
