import "server-only";

import { createDb, type FuriganaSegment } from "@mirai-gikai/db";
import { and, asc, eq, inArray, sql } from "@mirai-gikai/db/orm";
import {
  bill_contents,
  bills,
  bills_tags,
  sessions,
} from "@mirai-gikai/db/schema";
import {
  deleteDummyData,
  hasDummyData,
} from "@mirai-gikai/shared/csv-import/apply";
import {
  DummyDataExistsError,
  decideDummyHandling,
} from "@mirai-gikai/shared/csv-import/dummy-handling";
import type { BillInsert, BillUpdate } from "../../shared/types";
import type { DifficultyLevel } from "../../shared/types/bill-contents";

export async function findBillById(id: string) {
  const [row] = await createDb().select().from(bills).where(eq(bills.id, id));
  if (!row) {
    throw new Error(`Failed to fetch bill: ${id} not found`);
  }
  return row;
}

export async function findBillContentsByBillId(billId: string) {
  return createDb()
    .select()
    .from(bill_contents)
    .where(eq(bill_contents.bill_id, billId))
    .orderBy(asc(bill_contents.difficulty_level));
}

export async function findBillTagIdsByBillId(billId: string) {
  const rows = await createDb()
    .select({ tag_id: bills_tags.tag_id })
    .from(bills_tags)
    .where(eq(bills_tags.bill_id, billId));
  return rows.map((row) => row.tag_id);
}

export async function findBillBySlug(slug: string) {
  const [row] = await createDb()
    .select()
    .from(bills)
    .where(eq(bills.slug, slug));
  if (!row) {
    throw new Error(`Failed to fetch bill by slug: ${slug} not found`);
  }
  return row;
}

/**
 * 議案を作る。議会にダミーデータが残っていれば、同意（deleteDummyData）があるときだけ
 * 消してから作る（実データとダミーを同じ議会に並べない）。
 * 同意がなければ DummyDataExistsError を投げる。
 */
export async function createBillRecord(
  insertData: BillInsert,
  options: { deleteDummyData?: boolean } = {}
) {
  return createDb().transaction(async (tx) => {
    const handling = decideDummyHandling(
      await hasDummyData(tx, insertData.assembly_id),
      options.deleteDummyData ?? false
    );
    if (handling === "reject") throw new DummyDataExistsError();
    if (handling === "delete")
      await deleteDummyData(tx, insertData.assembly_id);

    const [row] = await tx
      .insert(bills)
      .values(insertData)
      .returning({ id: bills.id });
    return row;
  });
}

export async function updateBillRecord(id: string, updateData: BillUpdate) {
  await createDb()
    .update(bills)
    .set({ ...updateData, updated_at: sql`now()` })
    .where(eq(bills.id, id));
}

/** 件名のふりがなを保存する（件名を変えたときだけ作り直す） */
export async function updateBillNameFurigana(
  id: string,
  furigana: FuriganaSegment[]
) {
  await createDb()
    .update(bills)
    .set({ name_furigana: furigana })
    .where(eq(bills.id, id));
}

export async function upsertBillContent(params: {
  billId: string;
  difficultyLevel: DifficultyLevel;
  title: string;
  summary: string;
  content: string;
  furigana?: FuriganaSegment[] | null;
}) {
  const values = {
    title: params.title,
    summary: params.summary,
    content: params.content,
    ...(params.furigana !== undefined && { furigana: params.furigana }),
  };
  await createDb()
    .insert(bill_contents)
    .values({
      bill_id: params.billId,
      difficulty_level: params.difficultyLevel,
      ...values,
    })
    .onConflictDoUpdate({
      target: [bill_contents.bill_id, bill_contents.difficulty_level],
      set: { ...values, updated_at: sql`now()` },
    });
}

export async function findBillsTagsByBillId(billId: string) {
  return findBillTagIdsByBillId(billId);
}

export async function deleteBillsTags(billId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  await createDb()
    .delete(bills_tags)
    .where(
      and(eq(bills_tags.bill_id, billId), inArray(bills_tags.tag_id, tagIds))
    );
}

export async function createBillsTags(billId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  await createDb()
    .insert(bills_tags)
    .values(tagIds.map((tagId) => ({ bill_id: billId, tag_id: tagId })));
}
