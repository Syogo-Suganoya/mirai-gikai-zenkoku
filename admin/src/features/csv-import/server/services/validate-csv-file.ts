import "server-only";

import { createDb } from "@mirai-gikai/db";
import {
  loadExistingRecords,
  loadValidationContext,
} from "@mirai-gikai/shared/csv-import/apply";
import { diffRows } from "@mirai-gikai/shared/csv-import/diff";
import { decodeCsv } from "@mirai-gikai/shared/csv-import/encoding";
import { parseCsv } from "@mirai-gikai/shared/csv-import/parse";
import type { CsvImportKind } from "@mirai-gikai/shared/csv-import/types";
import { validateRows } from "@mirai-gikai/shared/csv-import/validate";

/**
 * CSV ファイルを読み込み、検証し、既にあるデータと突き合わせる（確認画面まで）。
 * DB には書き込まない。
 */
export async function validateCsvFile(
  kind: CsvImportKind,
  /** 議会マスタの取り込みは null */
  assemblyId: string | null,
  bytes: Uint8Array
) {
  const db = createDb();
  const { text, encoding } = decodeCsv(bytes);
  const parsed = parseCsv(text, kind);
  const [context, existing] = await Promise.all([
    loadValidationContext(db, kind, assemblyId),
    loadExistingRecords(db, kind, assemblyId),
  ]);
  const validated = validateRows(kind, parsed.rows, context);
  const diff = diffRows(kind, validated.records, existing);

  return {
    encoding,
    rowCount: parsed.rows.length,
    errors: [...parsed.errors, ...validated.errors],
    warnings: validated.warnings,
    diff,
  };
}
