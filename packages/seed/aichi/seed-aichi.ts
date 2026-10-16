import { readFileSync } from "node:fs";
import path from "node:path";
import type { FuriganaSegment, Tx } from "@mirai-gikai/db";
import { and, eq, sql } from "@mirai-gikai/db/orm";
import {
  assemblies,
  assembly_settings,
  bills,
  sessions,
} from "@mirai-gikai/db/schema";
import { importCsvFile } from "../lib/import-csv-file";
import { seedAichiContents } from "./seed-contents";

const DATA_DIR = path.join(import.meta.dirname, "data");

/**
 * 愛知県議会の初期データを入れる。
 * 議会マスタ → 会期 → 議案 → 議決結果 を CSV インポートと同じ処理で取り込み、
 * 解説付きの5件の本文を入れてから、件名と原文のみの議案も含めて公開する。
 */
export async function seedAichi(tx: Tx): Promise<string> {
  await importCsvFile(tx, "assemblies", null, path.join(DATA_DIR, "assemblies.csv"));
  const [assembly] = await tx
    .select({ id: assemblies.id })
    .from(assemblies)
    .where(eq(assemblies.slug, "aichi-pref"));
  const assemblyId = assembly.id;

  await tx
    .update(assemblies)
    .set({ status: "public" })
    .where(eq(assemblies.id, assemblyId));
  // AIチャット 出す、インタビュー 出さない（届け先が決まるまで）、スタンス 出さない、可否のみ
  await tx
    .update(assembly_settings)
    .set({
      show_ai_chat: true,
      show_interview: false,
      show_mirai_stance: false,
      vote_granularity: "result_only",
      default_publish_level: "title_only",
    })
    .where(eq(assembly_settings.assembly_id, assemblyId));

  for (const [kind, file] of [
    ["sessions", "sessions.csv"],
    ["bills", "bills.csv"],
    ["results", "results.csv"],
  ] as const) {
    const result = await importCsvFile(tx, kind, assemblyId, path.join(DATA_DIR, file));
    console.log(`  ${file}: 新規 ${result.insertCount} / 更新 ${result.updateCount}`);
  }

  // 件名のふりがなは移行元で確かめた読みを使う
  const furigana = JSON.parse(
    readFileSync(path.join(DATA_DIR, "name-furigana.json"), "utf8")
  ) as Record<string, FuriganaSegment[]>;
  const billRows = await tx
    .select({ id: bills.id, key: sessions.session_key, number: bills.bill_number })
    .from(bills)
    .innerJoin(sessions, eq(sessions.id, bills.session_id))
    .where(eq(bills.assembly_id, assemblyId));
  for (const bill of billRows) {
    const segments = furigana[`${bill.key}|${bill.number}`];
    if (segments) {
      await tx
        .update(bills)
        .set({ name_furigana: segments })
        .where(eq(bills.id, bill.id));
    }
  }

  const contentCount = await seedAichiContents(tx, assemblyId);
  console.log(`  解説付きの議案: ${contentCount} 件`);

  // 件名と原文のみの議案は解説の確認なしで公開してよい
  await tx
    .update(bills)
    .set({ publish_status: "published", published_at: sql`now()` })
    .where(
      and(eq(bills.assembly_id, assemblyId), eq(bills.publish_status, "draft"))
    );

  return assemblyId;
}
