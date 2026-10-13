import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, eq, sql } from "@mirai-gikai/db/orm";
import {
  assembly_settings,
  bills,
  interview_configs,
  mirai_stances,
} from "@mirai-gikai/db/schema";
import type {
  AssemblySettingsDataCounts,
  AssemblySettingsInput,
} from "../../shared/types";

export async function updateAssemblySettings(
  assemblyId: string,
  input: AssemblySettingsInput,
  updatedBy: string
) {
  await createDb()
    .update(assembly_settings)
    .set({ ...input, updated_by: updatedBy, updated_at: sql`now()` })
    .where(eq(assembly_settings.assembly_id, assemblyId));
}

/** 公開側に出せるデータの件数（ダミーは数えない） */
export async function countSettingsData(
  assemblyId: string
): Promise<AssemblySettingsDataCounts> {
  const db = createDb();
  const publishedBill = and(
    eq(bills.assembly_id, assemblyId),
    eq(bills.publish_status, "published"),
    eq(bills.is_dummy, false)
  );
  const [[billRow], [interviewRow], [stanceRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bills)
      .where(publishedBill),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(interview_configs)
      .innerJoin(bills, eq(bills.id, interview_configs.bill_id))
      .where(
        and(
          publishedBill,
          eq(interview_configs.status, "public"),
          sql`${interview_configs.deleted_at} is null`
        )
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mirai_stances)
      .innerJoin(bills, eq(bills.id, mirai_stances.bill_id))
      .where(
        and(
          publishedBill,
          sql`(${mirai_stances.publish_at} is null or ${mirai_stances.publish_at} <= now())`
        )
      ),
  ]);
  return {
    publishedBills: billRow?.count ?? 0,
    publicInterviews: interviewRow?.count ?? 0,
    publishedStances: stanceRow?.count ?? 0,
  };
}
