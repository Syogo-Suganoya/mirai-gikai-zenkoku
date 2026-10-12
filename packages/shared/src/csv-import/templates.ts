/**
 * CSV の列定義（6.2.3節）。テンプレート CSV もここから作るので、列定義はこの1か所だけに置く。
 */

import type { CsvImportKind } from "./types";

export type CsvColumn = {
  /** 英語名（DB の列名に合わせる） */
  key: string;
  /** 日本語の見出し（テンプレートに使う） */
  label: string;
  required: boolean;
  example: string;
  /** 補足（画面の列の説明に出す） */
  note?: string;
};

export const CSV_COLUMNS: Record<CsvImportKind, CsvColumn[]> = {
  assemblies: [
    { key: "local_gov_code", label: "団体コード", required: true, example: "401307" },
    { key: "name", label: "議会名", required: true, example: "福岡市議会" },
    {
      key: "type",
      label: "種類",
      required: true,
      example: "市",
      note: "都道府県／市／特別区／町／村",
    },
    { key: "prefecture_code", label: "都道府県コード", required: true, example: "40" },
    {
      key: "slug",
      label: "スラッグ",
      required: false,
      example: "fukuoka-city",
      note: "空なら団体コードから作る",
    },
    { key: "official_url", label: "公式サイト", required: false, example: "https://gikai.city.fukuoka.lg.jp/" },
  ],
  factions: [
    { key: "name", label: "会派名", required: true, example: "◯◯の会" },
    { key: "short_name", label: "略称", required: false, example: "◯◯" },
    { key: "seats", label: "議席数", required: false, example: "12" },
    { key: "valid_from", label: "有効開始日", required: true, example: "2023-05-01" },
    { key: "valid_to", label: "有効終了日", required: false, example: "" },
  ],
  sessions: [
    { key: "session_key", label: "会期キー", required: true, example: "2026-09" },
    { key: "name", label: "会期名", required: true, example: "令和8年9月定例会" },
    { key: "type", label: "種類", required: true, example: "定例会", note: "定例会／臨時会" },
    { key: "start_date", label: "開会日", required: true, example: "2026-09-01" },
    { key: "end_date", label: "閉会日", required: true, example: "2026-09-25" },
    { key: "source_url", label: "出典", required: false, example: "" },
  ],
  bills: [
    { key: "session_key", label: "会期キー", required: true, example: "2026-09" },
    { key: "bill_number", label: "議案番号", required: true, example: "議案第52号" },
    {
      key: "official_name",
      label: "正式名称",
      required: true,
      example: "◯◯市手数料条例の一部を改正する条例案",
    },
    {
      key: "name",
      label: "表示用タイトル",
      required: false,
      example: "",
      note: "空なら正式名称を使う",
    },
    {
      key: "category",
      label: "種類",
      required: true,
      example: "条例",
      note: "予算／条例／人事／契約／請願・陳情／報告／その他",
    },
    { key: "submitter", label: "提出者", required: false, example: "市長" },
    { key: "submitted_date", label: "提出日", required: false, example: "2026-08-25" },
    { key: "committee_name", label: "付託委員会", required: false, example: "総務財政委員会" },
    {
      key: "status",
      label: "状態",
      required: false,
      example: "提出",
      note: "準備中／提出／委員会付託／議決済み／継続審査／撤回（空なら提出）",
    },
    { key: "source_url", label: "原文 URL", required: false, example: "https://..." },
    { key: "source_pages", label: "ページ範囲", required: false, example: "12-15" },
    {
      key: "tags",
      label: "タグ",
      required: false,
      example: "子育て;税",
      note: "; 区切り。既存のタグ名のみ",
    },
  ],
  results: [
    { key: "session_key", label: "会期キー", required: true, example: "2026-09" },
    { key: "bill_number", label: "議案番号", required: true, example: "議案第52号" },
    { key: "result", label: "結果", required: true, example: "原案可決" },
    { key: "decided_on", label: "議決日", required: false, example: "2026-09-25" },
    { key: "yes_count", label: "賛成数", required: false, example: "40" },
    { key: "no_count", label: "反対数", required: false, example: "8" },
    { key: "source_url", label: "出典", required: false, example: "" },
  ],
};

/** 議決結果の CSV では、列定義にない見出しを会派名として扱う */
export const ACCEPTS_EXTRA_COLUMNS: Record<CsvImportKind, boolean> = {
  assemblies: false,
  factions: false,
  sessions: false,
  bills: false,
  results: true,
};

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** 行の配列を CSV の文字列にする（Excel で開けるよう CRLF 区切り） */
export function toCsvText(rows: string[][]): string {
  return `${rows.map((r) => r.map(escapeCell).join(",")).join("\r\n")}\r\n`;
}

/**
 * テンプレート CSV（日本語の見出し＋記入例1行）を作る。
 * 議決結果は、会派の列の例として「（会派名の列）」の代わりに会派名を渡せる。
 */
export function buildTemplateCsv(
  kind: CsvImportKind,
  factionNames: readonly string[] = []
): string {
  const columns = CSV_COLUMNS[kind];
  const header = [...columns.map((c) => c.label), ...factionNames];
  const example = [
    ...columns.map((c) => c.example),
    ...factionNames.map(() => "○"),
  ];
  return toCsvText([header, example]);
}
