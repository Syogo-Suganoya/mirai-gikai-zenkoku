import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// DB の接続。ローカルは Docker の PostgreSQL、本番・プレビューは Neon（どちらも DATABASE_URL で指定する）。
// Neon の接続プール（-pooler の URL）はトランザクション単位で接続を使い回すため、prepared statement を使わない。

function createDrizzle(url: string) {
  return drizzle(postgres(url, { max: 5, prepare: false, onnotice: () => {} }), { schema });
}

export type Db = ReturnType<typeof createDrizzle>;
/** トランザクション内で使う DB（`db.transaction(async (tx) => ...)` の tx） */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// 開発中のホットリロードやサーバーレスの再利用で接続を作りすぎないよう、プロセスで1つにする
const globalForDb = globalThis as unknown as { __miraiDb?: Db };

export function createDb(): Db {
  if (globalForDb.__miraiDb) return globalForDb.__miraiDb;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL が設定されていません");
  }
  globalForDb.__miraiDb = createDrizzle(url);
  return globalForDb.__miraiDb;
}
