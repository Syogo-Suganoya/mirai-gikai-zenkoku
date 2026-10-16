import type { Tx } from "@mirai-gikai/db";
import { and, eq, sql } from "@mirai-gikai/db/orm";
import {
  assemblies,
  assembly_factions,
  assembly_settings,
  bill_contents,
  bill_faction_votes,
  bill_results,
  bills,
  sessions,
} from "@mirai-gikai/db/schema";
import { deleteDummyData } from "@mirai-gikai/shared/csv-import/apply";
import { statusForResult } from "@mirai-gikai/shared/csv-import/normalize";
import {
  toFurigana,
  toFuriganaMultiline,
} from "@mirai-gikai/shared/furigana/generate";
import {
  PREFECTURES,
  prefectureAssemblySlug,
} from "@mirai-gikai/shared/prefectures";
import { DUMMY_THEMES } from "./prefectures";
import {
  buildDummyBills,
  DUMMY_FACTION_VALID_FROM,
  DUMMY_FACTIONS,
  DUMMY_SESSION,
  dummyGranularity,
} from "./templates";

/**
 * 愛知県以外の46都道府県議会にダミーデータを入れる。
 * 議会マスタは先に入れておく（seedPrefectureAssemblies）。何度実行しても同じ結果になるよう、
 * その議会の既存のダミーを消してから入れ直す。実データのある議会には入れない。
 */
export async function seedDummy(tx: Tx) {
  let billCount = 0;
  let skipped = 0;

  for (const [index, theme] of DUMMY_THEMES.entries()) {
    const prefecture = PREFECTURES.find((p) => p.name === theme.prefecture);
    if (!prefecture) throw new Error(`都道府県「${theme.prefecture}」がありません`);

    const [assembly] = await tx
      .select({ id: assemblies.id })
      .from(assemblies)
      .where(eq(assemblies.slug, prefectureAssemblySlug(prefecture)));
    if (!assembly) {
      throw new Error(`${theme.prefecture}議会がありません。先に議会マスタを入れてください`);
    }

    await deleteDummyData(tx, assembly.id);
    const [realBill] = await tx
      .select({ id: bills.id })
      .from(bills)
      .where(and(eq(bills.assembly_id, assembly.id), eq(bills.is_dummy, false)))
      .limit(1);
    if (realBill) {
      skipped++;
      continue;
    }

    const granularity = dummyGranularity(index);
    await tx
      .update(assemblies)
      .set({ status: "public" })
      .where(eq(assemblies.id, assembly.id));
    await tx
      .update(assembly_settings)
      .set({
        show_ai_chat: true,
        show_interview: false,
        show_mirai_stance: false,
        vote_granularity: granularity,
      })
      .where(eq(assembly_settings.assembly_id, assembly.id));

    const [session] = await tx
      .insert(sessions)
      .values({
        assembly_id: assembly.id,
        session_key: DUMMY_SESSION.session_key,
        slug: DUMMY_SESSION.session_key,
        name: DUMMY_SESSION.name,
        type: "regular",
        start_date: DUMMY_SESSION.start_date,
        end_date: DUMMY_SESSION.end_date,
        is_dummy: true,
      })
      .returning({ id: sessions.id });

    const factionIds: string[] = [];
    if (granularity === "faction") {
      const inserted = await tx
        .insert(assembly_factions)
        .values(
          DUMMY_FACTIONS.map((name) => ({
            assembly_id: assembly.id,
            name,
            valid_from: DUMMY_FACTION_VALID_FROM,
            is_dummy: true,
          }))
        )
        .returning({ id: assembly_factions.id });
      factionIds.push(...inserted.map((f) => f.id));
    }

    for (const dummy of buildDummyBills(theme, index)) {
      const [bill] = await tx
        .insert(bills)
        .values({
          assembly_id: assembly.id,
          session_id: session.id,
          bill_number: dummy.bill_number,
          name: dummy.name,
          name_furigana: await toFurigana(dummy.name),
          official_name: dummy.name,
          category: dummy.category,
          submitter: "知事",
          status: statusForResult(dummy.result),
          publish_level: dummy.publish_level,
          publish_status: "published",
          published_at: sql`now()`,
          is_dummy: true,
          knowledge_source: dummy.knowledge_source,
          use_knowledge_source_in_chat: dummy.knowledge_source !== null,
        })
        .returning({ id: bills.id });
      billCount++;

      for (const content of dummy.contents) {
        await tx.insert(bill_contents).values({
          bill_id: bill.id,
          ...content,
          furigana: await toFuriganaMultiline(content.content),
        });
      }

      await tx.insert(bill_results).values({
        bill_id: bill.id,
        result: dummy.result,
        decided_on: DUMMY_SESSION.end_date,
        yes_count: granularity === "count" ? (dummy.counts?.yes ?? null) : null,
        no_count: granularity === "count" ? (dummy.counts?.no ?? null) : null,
      });

      if (granularity === "faction" && dummy.faction_votes.length > 0) {
        await tx.insert(bill_faction_votes).values(
          dummy.faction_votes.map((vote, i) => ({
            bill_id: bill.id,
            faction_id: factionIds[i],
            vote,
          }))
        );
      }
    }
  }

  return { billCount, skipped };
}
