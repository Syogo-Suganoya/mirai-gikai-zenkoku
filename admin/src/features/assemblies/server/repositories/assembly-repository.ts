import "server-only";

import { createDb } from "@mirai-gikai/db";
import { asc, eq, sql } from "@mirai-gikai/db/orm";
import { assemblies, assembly_settings, bills } from "@mirai-gikai/db/schema";

/** すべての議会と議案数 */
export async function findAssembliesWithBillCounts() {
  const db = createDb();
  const counts = db
    .select({
      assembly_id: bills.assembly_id,
      total: sql<number>`count(*)::int`.as("total"),
      published:
        sql<number>`count(*) filter (where ${bills.publish_status} = 'published')::int`.as(
          "published"
        ),
      dummy: sql<number>`count(*) filter (where ${bills.is_dummy})::int`.as(
        "dummy"
      ),
    })
    .from(bills)
    .groupBy(bills.assembly_id)
    .as("counts");

  return db
    .select({
      id: assemblies.id,
      slug: assemblies.slug,
      name: assemblies.name,
      type: assemblies.type,
      prefecture_code: assemblies.prefecture_code,
      status: assemblies.status,
      billCount: sql<number>`coalesce(${counts.total}, 0)`,
      publishedBillCount: sql<number>`coalesce(${counts.published}, 0)`,
      dummyBillCount: sql<number>`coalesce(${counts.dummy}, 0)`,
    })
    .from(assemblies)
    .leftJoin(counts, eq(counts.assembly_id, assemblies.id))
    .orderBy(
      asc(assemblies.prefecture_code),
      asc(assemblies.type),
      asc(assemblies.name)
    );
}

/** すべての議会のスラッグと種類（ヘッダーの区分の表示に使う） */
export async function findAssemblySlugTypes() {
  return createDb()
    .select({ slug: assemblies.slug, type: assemblies.type })
    .from(assemblies);
}

export async function findAssemblyWithSettingsBySlug(slug: string) {
  const [row] = await createDb()
    .select({ assembly: assemblies, settings: assembly_settings })
    .from(assemblies)
    .innerJoin(
      assembly_settings,
      eq(assembly_settings.assembly_id, assemblies.id)
    )
    .where(eq(assemblies.slug, slug));
  return row ?? null;
}
