import { parse } from "csv-parse/sync";
import { ACCEPTS_EXTRA_COLUMNS, CSV_COLUMNS } from "./templates";
import { type CsvImportKind, type CsvIssue, type CsvRow, MAX_CSV_ROWS } from "./types";

export type ParseCsvResult = {
  rows: CsvRow[];
  /** 列定義にない見出し（議決結果では会派名） */
  extraColumns: string[];
  /** 見出しの不足など、ファイル全体のエラー */
  errors: CsvIssue[];
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^﻿/, "")
    .replace(/[\s　]/g, "")
    .replace(/（必須）|\(必須\)/g, "")
    .toLowerCase();
}

/**
 * CSV の文字列を読み、見出しを列名（英語名）に対応づけて行の配列にする。
 * 見出しは日本語（テンプレートの見出し）でも英語名でも受け付ける。列の順番は自由。
 */
export function parseCsv(text: string, kind: CsvImportKind): ParseCsvResult {
  let records: string[][];
  try {
    records = parse(text, {
      bom: true,
      relax_column_count: true,
      skip_empty_lines: true,
    }) as string[][];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      rows: [],
      extraColumns: [],
      errors: [{ row: 0, column: null, message: `CSV として読めません: ${message}` }],
    };
  }

  // 中身が空の行（カンマだけの行など）は捨てる
  const nonEmpty = records
    .map((cells, index) => ({ cells, row: index + 1 }))
    .filter(({ cells }) => cells.some((c) => c.trim() !== ""));

  if (nonEmpty.length === 0) {
    return {
      rows: [],
      extraColumns: [],
      errors: [{ row: 0, column: null, message: "CSV が空です" }],
    };
  }

  const [headerLine, ...dataLines] = nonEmpty;
  const columns = CSV_COLUMNS[kind];
  const lookup = new Map<string, string>();
  for (const column of columns) {
    lookup.set(normalizeHeader(column.key), column.key);
    lookup.set(normalizeHeader(column.label), column.key);
  }

  const errors: CsvIssue[] = [];
  const extraColumns: string[] = [];
  const headerKeys: Array<{ key: string; extra: boolean } | null> =
    headerLine.cells.map((raw) => {
      const label = raw.trim();
      if (label === "") return null;
      const key = lookup.get(normalizeHeader(label));
      if (key) return { key, extra: false };
      if (ACCEPTS_EXTRA_COLUMNS[kind]) {
        extraColumns.push(label);
        return { key: label, extra: true };
      }
      errors.push({
        row: headerLine.row,
        column: label,
        message: `見出し「${label}」はこの種類の CSV の列にありません`,
      });
      return null;
    });

  const present = new Set(
    headerKeys.filter((k) => k && !k.extra).map((k) => k?.key)
  );
  for (const column of columns) {
    if (column.required && !present.has(column.key)) {
      errors.push({
        row: headerLine.row,
        column: column.label,
        message: `必須の列「${column.label}」がありません`,
      });
    }
  }

  if (dataLines.length > MAX_CSV_ROWS) {
    errors.push({
      row: 0,
      column: null,
      message: `一度に取り込めるのは ${MAX_CSV_ROWS} 行までです（${dataLines.length} 行あります）`,
    });
  }

  const rows: CsvRow[] = dataLines.map(({ cells, row }) => {
    const values: Record<string, string> = {};
    const extra: Record<string, string> = {};
    headerKeys.forEach((key, i) => {
      if (!key) return;
      const cell = (cells[i] ?? "").trim();
      if (key.extra) extra[key.key] = cell;
      else values[key.key] = cell;
    });
    return { row, values, extra };
  });

  return { rows, extraColumns, errors };
}
