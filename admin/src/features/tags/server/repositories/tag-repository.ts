import "server-only";

import { createDb, isUniqueViolation } from "@mirai-gikai/db";
import { asc, count, eq, sql } from "@mirai-gikai/db/orm";
import { bills_tags, tags } from "@mirai-gikai/db/schema";

type TagUpdate = Partial<typeof tags.$inferInsert>;

/** 行が無いときのエラーコード（呼び出し側の map-tag-db-error が本家と同じコードで判定する） */
const NOT_FOUND = "PGRST116";
const UNIQUE_VIOLATION = "23505";

export async function findAllTagsWithBillCount() {
  const rows = await createDb()
    .select({
      id: tags.id,
      label: tags.label,
      description: tags.description,
      featured_priority: tags.featured_priority,
      created_at: tags.created_at,
      updated_at: tags.updated_at,
      bill_count: count(bills_tags.bill_id),
    })
    .from(tags)
    .leftJoin(bills_tags, eq(bills_tags.tag_id, tags.id))
    .groupBy(tags.id)
    .orderBy(
      sql`${tags.featured_priority} asc nulls last`,
      asc(tags.created_at)
    );

  // 本家（PostgREST の bills_tags(count)）と同じ形にそろえる
  return rows.map(({ bill_count, ...tag }) => ({
    ...tag,
    bills_tags: [{ count: bill_count }],
  }));
}

export async function createTagRecord(input: {
  label: string;
  description?: string | null;
  featured_priority?: number | null;
}) {
  try {
    const [data] = await createDb()
      .insert(tags)
      .values({
        label: input.label,
        description: input.description ?? null,
        featured_priority: input.featured_priority ?? null,
      })
      .returning();
    return { data, error: null };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        data: null,
        error: { code: UNIQUE_VIOLATION, message: String(error) },
      };
    }
    throw new Error(`タグの作成に失敗しました: ${String(error)}`);
  }
}

export async function updateTagRecord(
  id: string,
  input: {
    label?: string;
    description?: string | null;
    featured_priority?: number | null;
  }
) {
  // PATCH方式: undefinedのフィールドはupdate対象に含めず既存値を維持する
  const updateData: TagUpdate = {};
  if (input.label !== undefined) updateData.label = input.label;
  if (input.description !== undefined)
    updateData.description = input.description;
  if (input.featured_priority !== undefined)
    updateData.featured_priority = input.featured_priority;

  if (Object.keys(updateData).length === 0) {
    return {
      data: null,
      error: {
        code: "EMPTY_UPDATE",
        message: "更新するフィールドがありません",
      },
    };
  }

  try {
    const [data] = await createDb()
      .update(tags)
      .set({ ...updateData, updated_at: sql`now()` })
      .where(eq(tags.id, id))
      .returning();
    if (!data) {
      return { data: null, error: { code: NOT_FOUND, message: "not found" } };
    }
    return { data, error: null };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        data: null,
        error: { code: UNIQUE_VIOLATION, message: String(error) },
      };
    }
    throw new Error(`タグの更新に失敗しました: ${String(error)}`);
  }
}

export async function deleteTagRecord(id: string) {
  const deleted = await createDb()
    .delete(tags)
    .where(eq(tags.id, id))
    .returning({ id: tags.id });
  if (deleted.length === 0) {
    return { error: { code: NOT_FOUND, message: "not found" } };
  }
  return { error: null };
}
