import type { DiffResult } from "@mirai-gikai/shared/csv-import/diff";
import type {
  AnyCsvRecord,
  CsvImportKind,
  CsvIssue,
} from "@mirai-gikai/shared/csv-import/types";
import { naturalKey } from "@mirai-gikai/shared/csv-import/validate";
import type { CsvPreviewRow } from "../types";

/** 確認画面に並べる行の上限（件数は全体を出す） */
export const PREVIEW_ROW_LIMIT = 200;

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "（空）";
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === "object" && v !== null
          ? Object.values(v as Record<string, unknown>).join(":")
          : String(v)
      )
      .join("; ");
  }
  return String(value);
}

/** 一覧に出す名前（議案名・会期名・会派名など） */
export function recordLabel(record: AnyCsvRecord): string {
  if ("official_name" in record) return record.name ?? record.official_name;
  if ("result" in record) return `${record.bill_number}（${record.result}）`;
  if ("name" in record) return record.name;
  return "";
}

/** 目印を読みやすくする（区切りの | を空白に） */
export function formatKey(kind: CsvImportKind, record: AnyCsvRecord): string {
  return naturalKey(kind, record as never).replace(/\|/g, " ");
}

/**
 * 差分の結果を、確認画面に出す形にする（新規・更新は先頭の PREVIEW_ROW_LIMIT 件まで）。
 */
export function buildPreviewRows<K extends CsvImportKind>(
  kind: K,
  diff: DiffResult<K>
): { inserts: CsvPreviewRow[]; updates: CsvPreviewRow[] } {
  return {
    inserts: diff.inserts.slice(0, PREVIEW_ROW_LIMIT).map((r) => ({
      row: r.row,
      key: formatKey(kind, r.record),
      label: recordLabel(r.record),
      changes: [],
    })),
    updates: diff.updates.slice(0, PREVIEW_ROW_LIMIT).map((r) => ({
      row: r.row,
      key: formatKey(kind, r.record),
      label: recordLabel(r.record),
      changes: r.changes.map((c) => ({
        field: c.field,
        before: formatValue(c.before),
        after: formatValue(c.after),
      })),
    })),
  };
}

/** エラーの一覧を CSV にする（直して入れ直すためのダウンロード用） */
export function issuesToCsvRows(issues: readonly CsvIssue[]): string[][] {
  return [
    ["行", "列", "内容"],
    ...issues.map((i) => [String(i.row), i.column ?? "", i.message]),
  ];
}
