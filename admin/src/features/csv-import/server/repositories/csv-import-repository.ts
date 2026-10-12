import "server-only";

import { createDb, type Json } from "@mirai-gikai/db";
import { and, desc, eq, sql } from "@mirai-gikai/db/orm";
import {
  assembly_factions,
  csv_import_jobs,
  users,
} from "@mirai-gikai/db/schema";
import type {
  CsvImportKind,
  CsvIssue,
} from "@mirai-gikai/shared/csv-import/types";

export async function insertValidatedJob(params: {
  id: string;
  assemblyId: string;
  kind: CsvImportKind;
  fileName: string;
  filePath: string;
  encoding: string;
  rowCount: number;
  insertCount: number;
  updateCount: number;
  errors: CsvIssue[];
  /** 検証済みの行（確定でそのまま使う） */
  payload: unknown;
  createdBy: string;
}) {
  await createDb()
    .insert(csv_import_jobs)
    .values({
      id: params.id,
      assembly_id: params.assemblyId,
      kind: params.kind,
      file_name: params.fileName,
      file_path: params.filePath,
      encoding: params.encoding,
      // エラーがあれば確定できないので、最初から失敗として残す
      status: params.errors.length > 0 ? "failed" : "validated",
      row_count: params.rowCount,
      insert_count: params.insertCount,
      update_count: params.updateCount,
      error_count: params.errors.length,
      errors: params.errors as unknown as Json,
      payload: params.payload as Json,
      created_by: params.createdBy,
    });
}

export async function findValidatedJob(jobId: string, assemblyId: string) {
  const [row] = await createDb()
    .select()
    .from(csv_import_jobs)
    .where(
      and(
        eq(csv_import_jobs.id, jobId),
        eq(csv_import_jobs.assembly_id, assemblyId),
        eq(csv_import_jobs.status, "validated")
      )
    );
  return row ?? null;
}

export async function markJobCommitted(
  jobId: string,
  counts: { insertCount: number; updateCount: number }
) {
  await createDb()
    .update(csv_import_jobs)
    .set({
      status: "committed",
      insert_count: counts.insertCount,
      update_count: counts.updateCount,
      committed_at: sql`now()`,
      // 確定したら検証済みの行は要らない（元のファイルは file_path に残る）
      payload: null,
    })
    .where(eq(csv_import_jobs.id, jobId));
}

export async function markJobStatus(
  jobId: string,
  status: "failed" | "cancelled",
  message?: string
) {
  await createDb()
    .update(csv_import_jobs)
    .set({
      status,
      payload: null,
      ...(message && {
        errors: [{ row: 0, column: null, message }] as unknown as Json,
        error_count: 1,
      }),
    })
    .where(eq(csv_import_jobs.id, jobId));
}

export async function findJobsByAssembly(assemblyId: string, limit = 30) {
  return createDb()
    .select({
      id: csv_import_jobs.id,
      kind: csv_import_jobs.kind,
      fileName: csv_import_jobs.file_name,
      status: csv_import_jobs.status,
      rowCount: csv_import_jobs.row_count,
      insertCount: csv_import_jobs.insert_count,
      updateCount: csv_import_jobs.update_count,
      errorCount: csv_import_jobs.error_count,
      createdAt: csv_import_jobs.created_at,
      committedAt: csv_import_jobs.committed_at,
      createdByEmail: users.email,
    })
    .from(csv_import_jobs)
    .innerJoin(users, eq(users.id, csv_import_jobs.created_by))
    .where(eq(csv_import_jobs.assembly_id, assemblyId))
    .orderBy(desc(csv_import_jobs.created_at))
    .limit(limit);
}

/** テンプレートの会派の列に使う、いま有効な会派の名前 */
export async function findActiveFactionNames(
  assemblyId: string,
  today: string
): Promise<string[]> {
  const rows = await createDb()
    .select({ name: assembly_factions.name })
    .from(assembly_factions)
    .where(
      and(
        eq(assembly_factions.assembly_id, assemblyId),
        eq(assembly_factions.is_dummy, false),
        sql`${assembly_factions.valid_from} <= ${today}`,
        sql`(${assembly_factions.valid_to} is null or ${assembly_factions.valid_to} >= ${today})`
      )
    )
    .orderBy(desc(assembly_factions.seats));
  return rows.map((row) => row.name);
}
