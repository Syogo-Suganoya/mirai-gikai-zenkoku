import { findPrefectureByCode } from "../prefectures/prefectures";
import {
  normalizeAssemblyType,
  normalizeBillNumber,
  normalizeBillResult,
  normalizeBillStatus,
  normalizeCategory,
  normalizeDate,
  normalizeFactionVote,
  normalizeInteger,
  normalizeSessionType,
  normalizeUrl,
  toHalfWidth,
} from "./normalize";
import { CSV_COLUMNS } from "./templates";
import type {
  AssemblyRecord,
  BillCategory,
  BillRecord,
  CsvImportKind,
  CsvIssue,
  CsvRecordByKind,
  CsvRow,
  FactionRecord,
  FactionVoteRecord,
  ResultRecord,
  SessionRecord,
  VoteGranularity,
} from "./types";

/** 検証に使う DB の情報（呼び出し側で集めて渡す） */
export type ValidationContext = {
  /** 議案・議決結果: 議会に登録済みの会期キー */
  sessionKeys?: ReadonlySet<string>;
  /** 議案: 登録済みのタグ名 */
  tagLabels?: ReadonlySet<string>;
  /** 議決結果: 登録済みの議案（`会期キー|議案番号` → 種類） */
  bills?: ReadonlyMap<string, { category: BillCategory }>;
  /** 議決結果: 議会の会派 */
  factions?: ReadonlyArray<{
    name: string;
    short_name: string | null;
    valid_from: string;
    valid_to: string | null;
  }>;
  /** 議決結果: 議会設定の議決結果の粒度 */
  voteGranularity?: VoteGranularity;
  /** 議会マスタ: 登録済みのスラッグ（スラッグ → 団体コード） */
  assemblySlugs?: ReadonlyMap<string, string>;
  /** 今日の日付（YYYY-MM-DD）。議決日が空の行の会派の突き合わせに使う */
  today?: string;
};

export type ValidatedRow<K extends CsvImportKind> = {
  row: number;
  record: CsvRecordByKind[K];
};

export type ValidateResult<K extends CsvImportKind> = {
  records: ValidatedRow<K>[];
  errors: CsvIssue[];
  warnings: CsvIssue[];
};

/** 自然キー（突き合わせの目印）を作る */
export function naturalKey<K extends CsvImportKind>(
  kind: K,
  record: CsvRecordByKind[K]
): string {
  switch (kind) {
    case "assemblies":
      return (record as AssemblyRecord).local_gov_code;
    case "factions": {
      const r = record as FactionRecord;
      return `${r.name}|${r.valid_from}`;
    }
    case "sessions":
      return (record as SessionRecord).session_key;
    default: {
      const r = record as BillRecord | ResultRecord;
      return billKey(r.session_key, r.bill_number);
    }
  }
}

export function billKey(sessionKey: string, billNumber: string): string {
  return `${sessionKey}|${billNumber}`;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 1行ぶんの検証の道具（エラーを集めつつ値を読む） */
class RowReader {
  readonly errors: CsvIssue[] = [];
  readonly warnings: CsvIssue[] = [];

  constructor(
    private readonly kind: CsvImportKind,
    private readonly csvRow: CsvRow
  ) {}

  private label(key: string): string {
    return CSV_COLUMNS[this.kind].find((c) => c.key === key)?.label ?? key;
  }

  error(key: string | null, message: string) {
    this.errors.push({
      row: this.csvRow.row,
      column: key ? this.label(key) : null,
      message,
    });
  }

  warn(key: string | null, message: string) {
    this.warnings.push({
      row: this.csvRow.row,
      column: key ? this.label(key) : null,
      message,
    });
  }

  raw(key: string): string {
    return this.csvRow.values[key]?.trim() ?? "";
  }

  text(key: string): string | null {
    const v = this.raw(key);
    return v === "" ? null : v;
  }

  required(key: string): string {
    const v = this.raw(key);
    if (v === "") this.error(key, `${this.label(key)}は必須です`);
    return v;
  }

  date(key: string, required = false): string | null {
    const v = required ? this.required(key) : this.raw(key);
    if (v === "") return null;
    const date = normalizeDate(v);
    if (!date) {
      this.error(
        key,
        `「${v}」は日付として読めません（2026-09-01、R8.9.1、令和8年9月1日 の形で書いてください）`
      );
    }
    return date;
  }

  integer(key: string): number | null {
    const v = this.raw(key);
    const n = normalizeInteger(v);
    if (n === undefined) {
      this.error(key, `「${v}」は整数として読めません`);
      return null;
    }
    return n;
  }

  url(key: string): string | null {
    const v = this.raw(key);
    const url = normalizeUrl(v);
    if (url === undefined) {
      this.error(key, `「${v}」は URL（http:// か https:// で始まるもの）ではありません`);
      return null;
    }
    return url;
  }

  enumValue<T>(
    key: string,
    normalize: (value: string) => T | null,
    allowed: string,
    required: boolean
  ): T | null {
    const v = required ? this.required(key) : this.raw(key);
    if (v === "") return null;
    const value = normalize(v);
    if (value === null) {
      this.error(key, `「${v}」は${this.label(key)}として使えません（${allowed}）`);
    }
    return value;
  }
}

function readAssembly(
  r: RowReader,
  context: ValidationContext
): AssemblyRecord | null {
  const code = toHalfWidth(r.required("local_gov_code"));
  if (code !== "" && !/^\d{6}$/.test(code)) {
    r.error("local_gov_code", `団体コード「${code}」は6桁の数字で書いてください`);
  }
  const name = r.required("name");
  const type = r.enumValue(
    "type",
    normalizeAssemblyType,
    "都道府県／市／特別区／町／村",
    true
  );
  const prefectureRaw = toHalfWidth(r.required("prefecture_code"));
  const prefecture = prefectureRaw
    ? findPrefectureByCode(prefectureRaw)
    : undefined;
  if (prefectureRaw !== "" && !prefecture) {
    r.error("prefecture_code", `都道府県コード「${prefectureRaw}」は 01〜47 で書いてください`);
  }
  if (prefecture && /^\d{6}$/.test(code) && !code.startsWith(prefecture.code)) {
    r.error("local_gov_code", "団体コードの先頭2桁が都道府県コードと合いません");
  }
  const slug = r.text("slug");
  if (slug && !SLUG_RE.test(slug)) {
    r.error("slug", "スラッグは半角英小文字・数字・ハイフンで書いてください");
  }
  if (slug && context.assemblySlugs) {
    const owner = context.assemblySlugs.get(slug);
    if (owner && owner !== code) {
      r.error("slug", `スラッグ「${slug}」はほかの議会（団体コード ${owner}）が使っています`);
    }
  }
  const official_url = r.url("official_url");
  if (r.errors.length > 0 || !type || !prefecture) return null;
  return {
    local_gov_code: code,
    name,
    type,
    prefecture_code: prefecture.code,
    slug,
    official_url,
  };
}

function readFaction(r: RowReader): FactionRecord | null {
  const name = r.required("name");
  const short_name = r.text("short_name");
  const seats = r.integer("seats");
  const valid_from = r.date("valid_from", true);
  const valid_to = r.date("valid_to");
  if (valid_from && valid_to && valid_to < valid_from) {
    r.error("valid_to", "有効終了日が有効開始日より前です");
  }
  if (r.errors.length > 0 || !valid_from) return null;
  return { name, short_name, seats, valid_from, valid_to };
}

function readSession(r: RowReader): SessionRecord | null {
  const session_key = toHalfWidth(r.required("session_key"));
  const name = r.required("name");
  const type = r.enumValue("type", normalizeSessionType, "定例会／臨時会", true);
  const start_date = r.date("start_date", true);
  const end_date = r.date("end_date", true);
  if (start_date && end_date && end_date < start_date) {
    r.error("end_date", "閉会日が開会日より前です");
  }
  const source_url = r.url("source_url");
  if (r.errors.length > 0 || !type || !start_date || !end_date) return null;
  return { session_key, name, type, start_date, end_date, source_url };
}

function readBill(
  r: RowReader,
  context: ValidationContext
): BillRecord | null {
  const session_key = toHalfWidth(r.required("session_key"));
  if (session_key && context.sessionKeys && !context.sessionKeys.has(session_key)) {
    r.error("session_key", `会期キー「${session_key}」の会期が登録されていません。先に会期を取り込んでください`);
  }
  const bill_number = normalizeBillNumber(r.required("bill_number"));
  const official_name = r.required("official_name");
  const name = r.text("name");
  const category = r.enumValue(
    "category",
    normalizeCategory,
    "予算／条例／人事／契約／請願・陳情／報告／その他",
    true
  );
  const submitter = r.text("submitter");
  const submitted_date = r.date("submitted_date");
  const committee_name = r.text("committee_name");
  const status = r.enumValue(
    "status",
    normalizeBillStatus,
    "準備中／提出／委員会付託／議決済み／継続審査／撤回",
    false
  );
  const source_url = r.url("source_url");
  const source_pages = r.text("source_pages");

  let tags: string[] | null = null;
  const tagsRaw = r.raw("tags");
  if (tagsRaw !== "") {
    tags = [
      ...new Set(
        tagsRaw
          .split(/[;；]/)
          .map((t) => t.trim())
          .filter((t) => t !== "")
      ),
    ];
    if (context.tagLabels) {
      for (const tag of tags) {
        if (!context.tagLabels.has(tag)) {
          r.error("tags", `タグ「${tag}」は登録されていません（既存のタグ名だけ使えます）`);
        }
      }
    }
  }

  if (r.errors.length > 0 || !category) return null;
  return {
    session_key,
    bill_number,
    official_name,
    name,
    category,
    submitter,
    submitted_date,
    committee_name,
    status,
    source_url,
    source_pages,
    tags,
  };
}

/** 議決日の時点で有効な会派を、見出し（会派名か略称）で引く */
function findFaction(
  header: string,
  on: string,
  factions: NonNullable<ValidationContext["factions"]>
) {
  const h = header.replace(/[\s　]/g, "");
  return factions.find(
    (f) =>
      (f.name.replace(/[\s　]/g, "") === h ||
        f.short_name?.replace(/[\s　]/g, "") === h) &&
      f.valid_from <= on &&
      (f.valid_to === null || on <= f.valid_to)
  );
}

function readResult(
  r: RowReader,
  csvRow: CsvRow,
  context: ValidationContext,
  useFactions: boolean
): ResultRecord | "skip" | null {
  const session_key = toHalfWidth(r.required("session_key"));
  const bill_number = normalizeBillNumber(r.required("bill_number"));
  const resultRaw = r.required("result");
  const parsed = resultRaw ? normalizeBillResult(resultRaw) : null;
  if (resultRaw && !parsed) {
    r.error("result", `結果「${resultRaw}」が分かりません（可決／修正可決／否決／継続審査／撤回／採択／不採択 など）`);
  }
  if (parsed?.kind === "report") {
    r.warn("result", `「${resultRaw}」は報告のため取り込みません（報告は議決されません）`);
    return "skip";
  }

  if (session_key && bill_number && context.bills) {
    const bill = context.bills.get(billKey(session_key, bill_number));
    if (!bill) {
      r.error("bill_number", `会期キー「${session_key}」の「${bill_number}」の議案が登録されていません。先に議案を取り込んでください`);
    } else if (bill.category === "report") {
      r.warn("bill_number", "報告の議案のため取り込みません（報告は議決されません）");
      return "skip";
    }
  }

  const decided_on = r.date("decided_on");
  const yes_count = r.integer("yes_count");
  const no_count = r.integer("no_count");
  const source_url = r.url("source_url");

  const faction_votes: FactionVoteRecord[] = [];
  if (useFactions) {
    const on = decided_on ?? context.today ?? "9999-12-31";
    for (const [header, cell] of Object.entries(csvRow.extra)) {
      const vote = normalizeFactionVote(cell);
      if (vote === undefined) continue;
      if (vote === null) {
        r.error(null, `会派「${header}」の賛否「${cell}」が分かりません（○／×／棄権／欠席／分かれた）`);
        continue;
      }
      const faction = context.factions
        ? findFaction(header, on, context.factions)
        : undefined;
      if (!faction) {
        r.error(null, `見出し「${header}」は、議決日（${on}）の時点で有効な会派の名前・略称と合いません`);
        continue;
      }
      faction_votes.push({ faction_name: faction.name, vote });
    }
  }

  if (r.errors.length > 0 || !parsed || parsed.kind !== "result") return null;
  return {
    session_key,
    bill_number,
    result: parsed.value,
    decided_on,
    yes_count,
    no_count,
    source_url,
    faction_votes,
  };
}

/**
 * 読み込んだ行を検証・正規化する（6.2.4節の validateRows）。
 * 必須・型・目印の重複・会期や会派の存在を確かめ、行ごとのエラーと警告を返す。
 */
export function validateRows<K extends CsvImportKind>(
  kind: K,
  rows: readonly CsvRow[],
  context: ValidationContext = {}
): ValidateResult<K> {
  const records: ValidatedRow<K>[] = [];
  const errors: CsvIssue[] = [];
  const warnings: CsvIssue[] = [];

  const granularity = context.voteGranularity;
  const useFactions =
    kind === "results" && (granularity === "faction" || granularity === "member");
  if (
    kind === "results" &&
    !useFactions &&
    rows.some((row) =>
      Object.values(row.extra).some((v) => normalizeFactionVote(v) !== undefined)
    )
  ) {
    warnings.push({
      row: 1,
      column: null,
      message: "この議会の議決結果の粒度は「会派別」より粗いため、会派の列は取り込みません",
    });
  }

  const seen = new Map<string, number>();

  for (const csvRow of rows) {
    const reader = new RowReader(kind, csvRow);
    let record: CsvRecordByKind[CsvImportKind] | "skip" | null;
    switch (kind) {
      case "assemblies":
        record = readAssembly(reader, context);
        break;
      case "factions":
        record = readFaction(reader);
        break;
      case "sessions":
        record = readSession(reader);
        break;
      case "bills":
        record = readBill(reader, context);
        break;
      default:
        record = readResult(reader, csvRow, context, useFactions);
    }

    if (record && record !== "skip") {
      const key = naturalKey(kind, record as CsvRecordByKind[K]);
      const firstRow = seen.get(key);
      if (firstRow !== undefined) {
        reader.error(null, `${firstRow} 行目と同じものです（目印: ${key.replace("|", " ")}）`);
        record = null;
      } else {
        seen.set(key, csvRow.row);
      }
    }

    errors.push(...reader.errors);
    warnings.push(...reader.warnings);
    if (record && record !== "skip") {
      records.push({ row: csvRow.row, record: record as CsvRecordByKind[K] });
    }
  }

  return { records, errors, warnings };
}
