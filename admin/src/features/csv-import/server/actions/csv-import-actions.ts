"use server";

import { randomUUID } from "node:crypto";
import { createDb } from "@mirai-gikai/db";
import { applyCsvImport } from "@mirai-gikai/shared/csv-import/apply";
import { DummyDataExistsError } from "@mirai-gikai/shared/csv-import/dummy-handling";
import type { CsvRecordByKind } from "@mirai-gikai/shared/csv-import/types";
import { toFurigana } from "@mirai-gikai/shared/furigana/generate";
import { revalidatePath } from "next/cache";
import { requireAssemblyAction } from "@/features/assemblies/server/loaders/require-assembly";
import { routes } from "@/lib/routes";
import { getPublicFileStorage } from "@/lib/storage/public-file-storage";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  ASSEMBLY_CSV_KINDS,
  type AssemblyCsvKind,
  type CommitCsvResult,
  type CsvPreview,
} from "../../shared/types";
import { buildPreviewRows } from "../../shared/utils/build-csv-preview";
import {
  findValidatedJob,
  insertValidatedJob,
  markJobCommitted,
  markJobStatus,
} from "../repositories/csv-import-repository";
import { validateCsvFile } from "../services/validate-csv-file";

/** アップロードできるファイルの大きさの上限（5,000 行の議案一覧が十分入る） */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isAssemblyCsvKind(value: unknown): value is AssemblyCsvKind {
  return (ASSEMBLY_CSV_KINDS as readonly unknown[]).includes(value);
}

/**
 * CSV を検証して、確認画面の内容を返す。検証済みの行は取り込みの記録（csv_import_jobs）に
 * 保存し、確定ではその行をそのまま使う（確定時に再アップロードさせない）。
 */
export async function uploadCsv(
  assemblySlug: string,
  formData: FormData
): Promise<CsvPreview | { error: string }> {
  try {
    const kind = formData.get("kind");
    const file = formData.get("file");
    if (!isAssemblyCsvKind(kind)) return { error: "種類を選んでください" };
    if (!(file instanceof File)) return { error: "ファイルを選んでください" };
    if (file.size > MAX_FILE_SIZE) {
      return { error: "ファイルは5MB以下にしてください" };
    }

    const { assembly, user } = await requireAssemblyAction(assemblySlug);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await validateCsvFile(kind, assembly.id, bytes);

    // 元のファイルは取り込みの証跡として残す
    const jobId = randomUUID();
    const filePath = `csv-imports/${assembly.slug}/${jobId}.csv`;
    await getPublicFileStorage().put(filePath, bytes, "text/csv");

    const toApply = [...result.diff.inserts, ...result.diff.updates].map(
      (r) => r.record
    );
    await insertValidatedJob({
      id: jobId,
      assemblyId: assembly.id,
      kind,
      fileName: file.name,
      filePath,
      encoding: result.encoding,
      rowCount: result.rowCount,
      insertCount: result.diff.inserts.length,
      updateCount: result.diff.updates.length,
      errors: result.errors,
      payload: toApply,
      createdBy: user.id,
    });

    return {
      jobId,
      kind,
      fileName: file.name,
      encoding: result.encoding,
      rowCount: result.rowCount,
      ...buildPreviewRows(kind, result.diff),
      insertCount: result.diff.inserts.length,
      updateCount: result.diff.updates.length,
      unchangedCount: result.diff.unchanged.length,
      errors: result.errors,
      warnings: result.warnings,
    };
  } catch (error) {
    console.error("Upload CSV error:", error);
    return {
      error: getErrorMessage(error, "CSV の読み込み中にエラーが発生しました"),
    };
  }
}

/** 確認画面の内容を DB に反映する（1つのトランザクションで全行） */
export async function commitCsvImport(
  assemblySlug: string,
  jobId: string,
  options: { deleteDummyData?: boolean } = {}
): Promise<CommitCsvResult> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug);
    const job = await findValidatedJob(jobId, assembly.id);
    if (!job || !isAssemblyCsvKind(job.kind)) {
      return {
        error: "取り込みが見つかりません。もう一度ファイルを選んでください",
      };
    }

    const records = (job.payload ?? []) as CsvRecordByKind[AssemblyCsvKind][];
    try {
      const counts = await createDb().transaction((tx) =>
        applyCsvImport(tx, job.kind, assembly.id, records, {
          furigana: toFurigana,
          deleteDummyData: options.deleteDummyData,
        })
      );
      await markJobCommitted(job.id, counts);
      revalidatePath(routes.assemblyImport(assemblySlug));
      await invalidateWebCache([WEB_CACHE_TAGS.BILLS, WEB_CACHE_TAGS.SESSIONS]);
      return { success: true, ...counts };
    } catch (error) {
      if (error instanceof DummyDataExistsError) {
        return { needsDummyDeletion: true };
      }
      const message = getErrorMessage(error, "取り込みに失敗しました");
      await markJobStatus(job.id, "failed", message);
      revalidatePath(routes.assemblyImport(assemblySlug));
      return { error: message };
    }
  } catch (error) {
    console.error("Commit CSV error:", error);
    return {
      error: getErrorMessage(error, "取り込み中にエラーが発生しました"),
    };
  }
}

/** 確認画面で取り込まずにやめる */
export async function cancelCsvImport(
  assemblySlug: string,
  jobId: string
): Promise<void> {
  const { assembly } = await requireAssemblyAction(assemblySlug);
  const job = await findValidatedJob(jobId, assembly.id);
  if (job) await markJobStatus(job.id, "cancelled");
  revalidatePath(routes.assemblyImport(assemblySlug));
}
