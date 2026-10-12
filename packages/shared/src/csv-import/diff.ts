import type { CsvImportKind, CsvRecordByKind } from "./types";
import { naturalKey, type ValidatedRow } from "./validate";

export type FieldChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type DiffResult<K extends CsvImportKind> = {
  inserts: ValidatedRow<K>[];
  updates: Array<ValidatedRow<K> & { changes: FieldChange[] }>;
  unchanged: ValidatedRow<K>[];
};

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) {
    return JSON.stringify(
      value
        .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
        .sort()
    );
  }
  return value ?? null;
}

/**
 * 取り込む行を、既にある行（自然キーで引いたもの）と比べて新規／更新／変化なしに分ける。
 *
 * 既にある行の更新では、CSV の空欄（null）は「変えない」として扱う。
 * そのため null の項目は変更に数えない（取り込み時も上書きしない）。
 */
export function diffRows<K extends CsvImportKind>(
  kind: K,
  rows: readonly ValidatedRow<K>[],
  existing: ReadonlyMap<string, Partial<CsvRecordByKind[K]>>
): DiffResult<K> {
  const result: DiffResult<K> = { inserts: [], updates: [], unchanged: [] };

  for (const row of rows) {
    const before = existing.get(naturalKey(kind, row.record));
    if (!before) {
      result.inserts.push(row);
      continue;
    }

    const changes: FieldChange[] = [];
    for (const [field, after] of Object.entries(row.record)) {
      if (after === null) continue;
      const prev = (before as Record<string, unknown>)[field];
      if (normalizeForCompare(prev) !== normalizeForCompare(after)) {
        changes.push({ field, before: prev ?? null, after });
      }
    }

    if (changes.length > 0) {
      result.updates.push({ ...row, changes });
    } else {
      result.unchanged.push(row);
    }
  }

  return result;
}
