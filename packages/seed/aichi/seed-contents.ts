import { readFileSync } from "node:fs";
import path from "node:path";
import type { Tx } from "@mirai-gikai/db";
import { and, eq, sql } from "@mirai-gikai/db/orm";
import { bill_contents, bills, sessions } from "@mirai-gikai/db/schema";
import { toFuriganaMultiline } from "@mirai-gikai/shared/furigana/generate";
import type { ExplainedContents } from "./convert-lib";

const EXPLAINED_PATH = path.join(import.meta.dirname, "data/explained.json");

/**
 * 解説付きの5件の本文（bill_contents）と参照資料を入れる（CSV の対象外。8.3節）。
 * 議案そのものは先に CSV で取り込んでおく。
 *
 * 確認者は未登録なので reviewed_by は空のまま（画面では「移行データ（確認者未設定）」と出す）。
 */
export async function seedAichiContents(tx: Tx, assemblyId: string) {
  const explained = JSON.parse(
    readFileSync(EXPLAINED_PATH, "utf8")
  ) as ExplainedContents[];

  for (const item of explained) {
    const [bill] = await tx
      .select({ id: bills.id })
      .from(bills)
      .innerJoin(sessions, eq(sessions.id, bills.session_id))
      .where(
        and(
          eq(bills.assembly_id, assemblyId),
          eq(sessions.session_key, item.session_key),
          eq(bills.bill_number, item.bill_number)
        )
      );
    if (!bill) {
      throw new Error(
        `議案 ${item.session_key} ${item.bill_number} がありません。先に bills.csv を取り込んでください`
      );
    }

    for (const content of item.contents) {
      const furigana = await toFuriganaMultiline(content.content);
      await tx
        .insert(bill_contents)
        .values({ bill_id: bill.id, ...content, furigana })
        .onConflictDoUpdate({
          target: [bill_contents.bill_id, bill_contents.difficulty_level],
          set: {
            title: content.title,
            summary: content.summary,
            content: content.content,
            furigana,
          },
        });
    }

    await tx
      .update(bills)
      .set({
        publish_level: "explained",
        publish_status: "published",
        published_at: sql`coalesce(${bills.published_at}, now())`,
        is_featured: true,
        knowledge_source: item.knowledge_source,
        use_knowledge_source_in_chat: true,
      })
      .where(eq(bills.id, bill.id));
  }

  return explained.length;
}

