import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, asc, eq, sql } from "@mirai-gikai/db/orm";
import {
  assemblies,
  assembly_members,
  assembly_settings,
  bills,
} from "@mirai-gikai/db/schema";
import type { AssemblyMemberRole } from "../../shared/types";

/** 議会と議案数。userId を渡すとその人が担当する議会だけ */
export async function findAssembliesWithBillCounts(userId?: string) {
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

  const base = db
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
    .$dynamic();

  const query = userId
    ? base.innerJoin(
        assembly_members,
        and(
          eq(assembly_members.assembly_id, assemblies.id),
          eq(assembly_members.user_id, userId)
        )
      )
    : base;

  return query.orderBy(
    asc(assemblies.prefecture_code),
    asc(assemblies.type),
    asc(assemblies.name)
  );
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

export async function findAssemblyMemberRole(
  assemblyId: string,
  userId: string
): Promise<AssemblyMemberRole | null> {
  const [row] = await createDb()
    .select({ role: assembly_members.role })
    .from(assembly_members)
    .where(
      and(
        eq(assembly_members.assembly_id, assemblyId),
        eq(assembly_members.user_id, userId)
      )
    );
  return row?.role ?? null;
}
