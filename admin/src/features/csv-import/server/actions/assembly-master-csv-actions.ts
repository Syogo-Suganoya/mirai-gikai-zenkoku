"use server";

import { randomUUID } from "node:crypto";
import { createDb } from "@mirai-gikai/db";
import { applyCsvImport } from "@mirai-gikai/shared/csv-import/apply";
import type { AssemblyRecord } from "@mirai-gikai/shared/csv-import/types";
import { toFurigana } from "@mirai-gikai/shared/furigana/generate";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";
import { getPublicFileStorage } from "@/lib/storage/public-file-storage";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { CommitCsvResult, CsvPreview } from "../../shared/types";
import { buildPreviewRows } from "../../shared/utils/build-csv-preview";
import {
  findValidatedJob,
  insertValidatedJob,
  markJobCommitted,
  markJobStatus,
} from "../repositories/csv-import-repository";
import { validateCsvFile } from "../services/validate-csv-file";

/** 議会マスタは全国で約1,800議会なので、議案の取り込みと同じ上限で足りる */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 議会マスタの CSV を検証して、確認画面の内容を返す（設計 v3 6.2節）。
 * 取り込みの記録は議会を持たない（assembly_id が null）。
 */
export async function uploadAssemblyMasterCsv(
  formData: FormData
): Promise<CsvPreview | { error: string }> {
  try {
    const user = await requireUser();
    const file = formData.get("file");
    if (formData.get("kind") !== "assemblies") {
      return { error: "種類を選んでください" };
    }
    if (!(file instanceof File)) return { error: "ファイルを選んでください" };
    if (file.size > MAX_FILE_SIZE) {
      return { error: "ファイルは5MB以下にしてください" };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await validateCsvFile("assemblies", null, bytes);

    const jobId = randomUUID();
    const filePath = `csv-imports/_assemblies/${jobId}.csv`;
    await getPublicFileStorage().put(filePath, bytes, "text/csv");

    await insertValidatedJob({
      id: jobId,
      assemblyId: null,
      kind: "assemblies",
      fileName: file.name,
      filePath,
      encoding: result.encoding,
      rowCount: result.rowCount,
      insertCount: result.diff.inserts.length,
      updateCount: result.diff.updates.length,
      errors: result.errors,
      payload: [...result.diff.inserts, ...result.diff.updates].map(
        (r) => r.record
      ),
      createdBy: user.id,
    });

    return {
      jobId,
      kind: "assemblies",
      fileName: file.name,
      encoding: result.encoding,
      rowCount: result.rowCount,
      ...buildPreviewRows("assemblies", result.diff),
      insertCount: result.diff.inserts.length,
      updateCount: result.diff.updates.length,
      unchangedCount: result.diff.unchanged.length,
      errors: result.errors,
      warnings: result.warnings,
    };
  } catch (error) {
    console.error("Upload assembly master CSV error:", error);
    return {
      error: getErrorMessage(error, "CSV の読み込み中にエラーが発生しました"),
    };
  }
}

/** 確認画面の内容を DB に反映する（1つのトランザクションで全行） */
export async function commitAssemblyMasterCsv(
  jobId: string,
  _options: { deleteDummyData?: boolean } = {}
): Promise<CommitCsvResult> {
  try {
    await requireUser();
    const job = await findValidatedJob(jobId, null);
    if (!job || job.kind !== "assemblies") {
      return {
        error: "取り込みが見つかりません。もう一度ファイルを選んでください",
      };
    }
    const records = (job.payload ?? []) as AssemblyRecord[];
    try {
      const counts = await createDb().transaction((tx) =>
        applyCsvImport(tx, "assemblies", null, records, {
          furigana: toFurigana,
        })
      );
      await markJobCommitted(job.id, counts);
      revalidatePath(routes.home());
      revalidatePath(routes.assemblyMasterImport());
      await invalidateWebCache([WEB_CACHE_TAGS.ASSEMBLIES]);
      return { success: true, ...counts };
    } catch (error) {
      const message = getErrorMessage(error, "取り込みに失敗しました");
      await markJobStatus(job.id, "failed", message);
      revalidatePath(routes.assemblyMasterImport());
      return { error: message };
    }
  } catch (error) {
    console.error("Commit assembly master CSV error:", error);
    return {
      error: getErrorMessage(error, "取り込み中にエラーが発生しました"),
    };
  }
}

/** 確認画面で取り込まずにやめる */
export async function cancelAssemblyMasterCsv(jobId: string): Promise<void> {
  await requireUser();
  const job = await findValidatedJob(jobId, null);
  if (job) await markJobStatus(job.id, "cancelled");
  revalidatePath(routes.assemblyMasterImport());
}
