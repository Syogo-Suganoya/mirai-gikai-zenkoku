import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, asc, desc, eq, sql } from "@mirai-gikai/db/orm";
import {
  assemblies,
  bill_contents,
  bills,
  preview_tokens,
  sessions,
} from "@mirai-gikai/db/schema";
import type {
  BillInsert,
  BillPublishStatus,
  BillSortConfig,
  BillWithSession,
} from "../../shared/types";

type BillContentInsert = typeof bill_contents.$inferInsert;

/** 並び替えに使える列 */
const SORT_COLUMNS = {
  created_at: bills.created_at,
  submitted_date: bills.submitted_date,
  status_order: bills.status_order,
  publish_status_order: bills.publish_status_order,
} as const;

/** 議会の議案一覧（会期名つき） */
export async function findBillsWithSessionsByAssembly(
  assemblyId: string,
  sortConfig?: BillSortConfig
): Promise<BillWithSession[]> {
  const column = SORT_COLUMNS[sortConfig?.field ?? "created_at"];
  const ascending = (sortConfig?.order ?? "desc") === "asc";
  // 提出日は空の議案を後ろに回す
  const order =
    sortConfig?.field === "submitted_date"
      ? sql`${column} ${sql.raw(ascending ? "asc" : "desc")} nulls last`
      : ascending
        ? asc(column)
        : desc(column);

  const rows = await createDb()
    .select({ bill: bills, session: { name: sessions.name } })
    .from(bills)
    .innerJoin(sessions, eq(sessions.id, bills.session_id))
    .where(eq(bills.assembly_id, assemblyId))
    .orderBy(order, asc(bills.id));
  return rows.map((row) => ({ ...row.bill, session: row.session }));
}

export async function findBillById(billId: string) {
  const [row] = await createDb()
    .select()
    .from(bills)
    .where(eq(bills.id, billId));
  if (!row) {
    throw new Error(`Failed to fetch bill: ${billId} not found`);
  }
  return row;
}

/** 議案の議会（公開サイトの URL・権限の確認に使う） */
export async function findBillAssembly(billId: string) {
  const [row] = await createDb()
    .select({
      id: assemblies.id,
      slug: assemblies.slug,
      name: assemblies.name,
      bill_slug: bills.slug,
    })
    .from(bills)
    .innerJoin(assemblies, eq(assemblies.id, bills.assembly_id))
    .where(eq(bills.id, billId));
  return row ?? null;
}

export async function createBill(insertData: BillInsert) {
  const [row] = await createDb()
    .insert(bills)
    .values(insertData)
    .returning({ id: bills.id });
  return row;
}

export async function deleteBillById(id: string) {
  await createDb().delete(bills).where(eq(bills.id, id));
}

export async function updateBillPublishStatus(
  billId: string,
  publishStatus: BillPublishStatus
) {
  await createDb()
    .update(bills)
    .set({
      publish_status: publishStatus,
      // 初めて公開したときの日時を残す（一覧の並びと「新着」に使う）
      ...(publishStatus === "published"
        ? { published_at: sql`coalesce(${bills.published_at}, now())` }
        : {}),
      updated_at: sql`now()`,
    })
    .where(eq(bills.id, billId));
}

export async function findBillContentsByBillId(billId: string) {
  return createDb()
    .select()
    .from(bill_contents)
    .where(eq(bill_contents.bill_id, billId));
}

export async function createBillContents(contents: BillContentInsert[]) {
  if (contents.length === 0) return;
  await createDb().insert(bill_contents).values(contents);
}

export async function findPreviewToken(billId: string) {
  const [row] = await createDb()
    .select({
      token: preview_tokens.token,
      expires_at: preview_tokens.expires_at,
    })
    .from(preview_tokens)
    .where(eq(preview_tokens.bill_id, billId));
  return row ?? null;
}

export async function createPreviewToken(params: {
  billId: string;
  token: string;
  expiresAt: string;
  createdBy: string;
}) {
  await createDb().insert(preview_tokens).values({
    bill_id: params.billId,
    token: params.token,
    expires_at: params.expiresAt,
    created_by: params.createdBy,
  });
}

export async function deletePreviewTokenByBillId(billId: string) {
  await createDb()
    .delete(preview_tokens)
    .where(eq(preview_tokens.bill_id, billId));
}

export async function findPreviewTokenForValidation(
  billId: string,
  token: string
) {
  const [row] = await createDb()
    .select({ expires_at: preview_tokens.expires_at })
    .from(preview_tokens)
    .where(
      and(eq(preview_tokens.bill_id, billId), eq(preview_tokens.token, token))
    );
  return row ?? null;
}

/** 全議会の議案（選択肢用。議会名つき・ダミーを除く） */
export async function findAllBillOptions() {
  return createDb()
    .select({ id: bills.id, name: bills.name, assemblyName: assemblies.name })
    .from(bills)
    .innerJoin(assemblies, eq(assemblies.id, bills.assembly_id))
    .where(eq(bills.is_dummy, false))
    .orderBy(asc(assemblies.prefecture_code), desc(bills.created_at));
}
