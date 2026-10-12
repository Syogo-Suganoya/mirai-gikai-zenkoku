import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type * as tables from "./schema/tables";

export type { FuriganaSegment, Json } from "./schema/tables";

type Schema = typeof tables;

type EnumLike = { enumName: string; enumValues: readonly string[] };

type TableNames = {
  [K in keyof Schema]: Schema[K] extends PgTable ? K : never;
}[keyof Schema];

type EnumNames = {
  [K in keyof Schema]: Schema[K] extends EnumLike ? K : never;
}[keyof Schema];

/**
 * 本家の Supabase 生成型（`Database["public"]["Tables"][T]["Row"]` など）と同じ形の型。
 * Drizzle のスキーマ定義から作るので、スキーマを変えれば自動で追従する。
 */
export type Database = {
  public: {
    Tables: {
      [K in TableNames]: {
        Row: Schema[K] extends PgTable ? InferSelectModel<Schema[K]> : never;
        Insert: Schema[K] extends PgTable ? InferInsertModel<Schema[K]> : never;
        Update: Schema[K] extends PgTable
          ? Partial<InferInsertModel<Schema[K]>>
          : never;
      };
    };
    Enums: {
      [K in EnumNames]: Schema[K] extends EnumLike
        ? Schema[K]["enumValues"][number]
        : never;
    };
  };
};

export type Tables<T extends TableNames> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends TableNames> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends TableNames> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends EnumNames> = Database["public"]["Enums"][T];
