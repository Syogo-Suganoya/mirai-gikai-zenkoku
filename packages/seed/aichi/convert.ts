/**
 * 移行元（mirai-gikai-nagoya）の愛知県議会のデータを、CSV インポートの形式で書き出す（8.3節）。
 *
 *   pnpm --filter @mirai-gikai/seed aichi:convert -- <移行元リポジトリのパス>
 *
 * 書き出したファイル（aichi/data/）はリポジトリに入れ、`pnpm seed` と CSV インポート画面の両方で使う。
 * 名古屋市会のデータは移行しない（8.1節）。
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { toCsvText } from "@mirai-gikai/shared/csv-import/templates";
import { CSV_COLUMNS } from "@mirai-gikai/shared/csv-import/templates";
import type { CsvImportKind } from "@mirai-gikai/shared/csv-import/types";
import {
  AICHI_COUNCIL,
  AICHI_SESSIONS,
  agendaToBillRow,
  agendaToResultRow,
  explainedToBillRow,
  explainedToContents,
  explainedToResultRow,
  type SourceAgenda,
  type SourceExplainedBill,
} from "./convert-lib";

const DATA_DIR = path.join(import.meta.dirname, "data");

function writeCsv(
  file: string,
  kind: CsvImportKind,
  rows: Array<Record<string, string>>
) {
  const columns = CSV_COLUMNS[kind];
  const text = toCsvText([
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => row[c.key] ?? "")),
  ]);
  writeFileSync(path.join(DATA_DIR, file), text);
  console.log(`✅ ${file}: ${rows.length} 行`);
}

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    throw new Error("使い方: pnpm aichi:convert -- <mirai-gikai-nagoya のパス>");
  }

  const agendas = (
    JSON.parse(
      readFileSync(path.join(sourceDir, "data/agendas.json"), "utf8")
    ) as { items: SourceAgenda[] }
  ).items.filter((item) => item.council === AICHI_COUNCIL);

  const billsModule = (await import(
    pathToFileURL(path.join(sourceDir, "data/bills.ts")).href
  )) as { bills: SourceExplainedBill[] };
  const explained = billsModule.bills.filter(
    (bill) => bill.council === AICHI_COUNCIL
  );

  writeCsv("assemblies.csv", "assemblies", [
    {
      local_gov_code: "230006",
      name: "愛知県議会",
      type: "都道府県",
      prefecture_code: "23",
      slug: "aichi-pref",
      official_url: "https://www.pref.aichi.jp/site/gikai/",
    },
  ]);
  writeCsv(
    "sessions.csv",
    "sessions",
    AICHI_SESSIONS.map((s) => ({ ...s }))
  );
  writeCsv("bills.csv", "bills", [
    ...explained.map(explainedToBillRow),
    ...agendas.map(agendaToBillRow),
  ]);
  writeCsv(
    "results.csv",
    "results",
    [
      ...explained.map(explainedToResultRow),
      ...agendas.map(agendaToResultRow),
    ].filter((row) => row !== null)
  );

  // 件名のふりがなは移行元で確かめた読みをそのまま使う（CSV の対象外なので JSON で持つ）
  const furigana = Object.fromEntries(
    [...explained, ...agendas].map((item) => [
      `${"sessionMonth" in item ? item.sessionMonth : explainedToContents(item).session_key}|${item.billNumber}`,
      item.nameFurigana,
    ])
  );
  writeFileSync(
    path.join(DATA_DIR, "name-furigana.json"),
    `${JSON.stringify(furigana, null, 2)}\n`
  );
  console.log(`✅ name-furigana.json: ${Object.keys(furigana).length} 件`);

  writeFileSync(
    path.join(DATA_DIR, "explained.json"),
    `${JSON.stringify(explained.map(explainedToContents), null, 2)}\n`
  );
  console.log(`✅ explained.json: ${explained.length} 件`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
