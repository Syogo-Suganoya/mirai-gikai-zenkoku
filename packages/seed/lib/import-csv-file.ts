import { readFileSync } from "node:fs";
import type { Tx } from "@mirai-gikai/db";
import { toFurigana } from "@mirai-gikai/shared/furigana/generate";
import {
  applyCsvImport,
  loadValidationContext,
} from "@mirai-gikai/shared/csv-import/apply";
import { decodeCsv } from "@mirai-gikai/shared/csv-import/encoding";
import { parseCsv } from "@mirai-gikai/shared/csv-import/parse";
import type { CsvImportKind } from "@mirai-gikai/shared/csv-import/types";
import { validateRows } from "@mirai-gikai/shared/csv-import/validate";

/**
 * CSV ファイルを、管理画面の CSV インポートと同じ手順（読み込み → 検証 → 反映）で取り込む。
 * エラーが1件でもあれば取り込まずに例外にする。
 */
export async function importCsvFile(
  tx: Tx,
  kind: CsvImportKind,
  assemblyId: string | null,
  filePath: string
) {
  const { text } = decodeCsv(new Uint8Array(readFileSync(filePath)));
  const parsed = parseCsv(text, kind);
  const context = await loadValidationContext(tx, kind, assemblyId);
  const validated = validateRows(kind, parsed.rows, context);
  const errors = [...parsed.errors, ...validated.errors];
  if (errors.length > 0) {
    throw new Error(
      `${filePath} にエラーがあります:\n${errors
        .map((e) => `  ${e.row}行目 ${e.column ?? ""}: ${e.message}`)
        .join("\n")}`
    );
  }
  for (const w of validated.warnings) {
    console.warn(`  ⚠️ ${w.row}行目: ${w.message}`);
  }
  return applyCsvImport(
    tx,
    kind,
    assemblyId,
    validated.records.map((r) => r.record),
    // ローカルの初期データ投入なので、ダミーが残っていれば確認なしで消してから入れる
    { furigana: toFurigana, deleteDummyData: true }
  );
}
