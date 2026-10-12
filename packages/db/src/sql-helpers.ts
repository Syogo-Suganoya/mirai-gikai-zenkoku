import { type SQL, sql } from "drizzle-orm";
import type { Db, Tx } from "./client";

/**
 * uuid の配列を Postgres の uuid[] リテラルにする。
 * drizzle の sql テンプレートに JS の配列をそのまま渡すと `($1, $2)` に展開されるため、
 * DB function の配列引数にはこれを使う。
 */
export function uuidArray(ids: readonly string[]): SQL {
  if (ids.length === 0) return sql`'{}'::uuid[]`;
  return sql`array[${sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `
  )}]::uuid[]`;
}

/** text の配列を Postgres の text[] リテラルにする */
export function textArray(values: readonly string[]): SQL {
  if (values.length === 0) return sql`'{}'::text[]`;
  return sql`array[${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `
  )}]::text[]`;
}

/**
 * 行を返す SQL（DB function の呼び出しなど）を実行して行の配列を得る。
 * 本家の `supabase.rpc(...)` の置き換えに使う。
 * bigint・numeric は文字列で返るので、呼び出し側で Number() にする。
 */
export async function queryRows<T>(db: Db | Tx, query: SQL): Promise<T[]> {
  const rows = await db.execute(query);
  return rows as unknown as T[];
}

/** Postgres のエラーコードを取り出す（drizzle が包んだエラーの cause も見る） */
export function pgErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < 3 && current; i++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string") return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/** 一意制約違反（23505）かどうか */
export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === "23505";
}
