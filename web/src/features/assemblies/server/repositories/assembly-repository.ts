import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, eq, sql } from "@mirai-gikai/db/orm";
import {
  assemblies,
  assembly_settings,
  bills,
  sessions,
} from "@mirai-gikai/db/schema";

/** スラッグで議会と設定を取得する。なければ null */
export async function findAssemblyBySlug(slug: string) {
  const db = createDb();
  const [row] = await db
    .select({ assembly: assemblies, settings: assembly_settings })
    .from(assemblies)
    .innerJoin(
      assembly_settings,
      eq(assembly_settings.assembly_id, assemblies.id)
    )
    .where(eq(assemblies.slug, slug));
  if (!row) return null;

  const [dummy] = await db
    .select({ id: bills.id })
    .from(bills)
    .where(
      and(eq(bills.assembly_id, row.assembly.id), eq(bills.is_dummy, true))
    )
    .limit(1);

  return { ...row.assembly, settings: row.settings, hasDummy: Boolean(dummy) };
}

/**
 * 議会ごとの公開中の議案数・ダミーの有無・開会中の会期を集計する（議会選択画面）。
 * 議案のない議会は返さない（議会の一覧に出さない）。
 */
export async function findAssembliesWithPublishedBills(today: string) {
  const db = createDb();
  return db
    .select({
      id: assemblies.id,
      slug: assemblies.slug,
      name: assemblies.name,
      type: assemblies.type,
      prefecture_code: assemblies.prefecture_code,
      publishedBillCount: sql<number>`count(${bills.id})::int`,
      realBillCount: sql<number>`count(${bills.id}) filter (where not ${bills.is_dummy})::int`,
      activeSessionName: sql<string | null>`(
        select ${sessions.name} from ${sessions}
        where ${sessions.assembly_id} = ${assemblies.id}
          and (${sessions.is_active} or (${sessions.start_date} <= ${today} and ${today} <= ${sessions.end_date}))
        order by ${sessions.start_date} desc
        limit 1
      )`,
    })
    .from(assemblies)
    .innerJoin(
      bills,
      and(
        eq(bills.assembly_id, assemblies.id),
        eq(bills.publish_status, "published")
      )
    )
    .groupBy(assemblies.id)
    .orderBy(assemblies.prefecture_code, assemblies.type, assemblies.name);
}
