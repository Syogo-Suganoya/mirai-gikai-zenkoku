"use server";

import { createDb, queryRows } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { revalidateTag } from "next/cache";
import { requireUser } from "@/features/auth/server/lib/session";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { verifyConfigBelongsToBill } from "../services/verify-config-belongs-to-bill";

interface BulkPublishParams {
  configId: string;
  billId: string;
  maxModerationScore: number;
  minContentRichness: number;
}

interface BulkPublishResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
}

export async function bulkPublishReportsAction(
  params: BulkPublishParams
): Promise<BulkPublishResult> {
  await requireUser();

  try {
    await verifyConfigBelongsToBill(params.configId, params.billId);
    const [row] = await queryRows<{ count: number | null }>(
      createDb(),
      sql`select bulk_publish_reports(
        ${params.configId}::uuid,
        ${params.maxModerationScore}::integer,
        ${params.minContentRichness}::integer
      ) as count`
    );
    const updatedCount = Number(row?.count ?? 0);

    revalidateTag("public-interview-reports");
    // admin の revalidateTag は admin 内のキャッシュにしか効かない。
    // web の一覧が持つ回答数キャッシュは HTTP 経由で無効化する。
    await invalidateWebCache([WEB_CACHE_TAGS.PUBLIC_INTERVIEW_REPORTS]);

    return { success: true, updatedCount };
  } catch (error) {
    console.error("Bulk publish failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "一括公開に失敗しました",
    };
  }
}

export async function countBulkPublishTargetsAction(
  params: BulkPublishParams
): Promise<{ success: boolean; count?: number; error?: string }> {
  await requireUser();

  try {
    await verifyConfigBelongsToBill(params.configId, params.billId);
    const [row] = await queryRows<{ count: number | null }>(
      createDb(),
      sql`select count_bulk_publish_targets(
        ${params.configId}::uuid,
        ${params.maxModerationScore}::integer,
        ${params.minContentRichness}::integer
      ) as count`
    );
    return { success: true, count: Number(row?.count ?? 0) };
  } catch (error) {
    console.error("Count bulk publish targets failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "対象件数の取得に失敗しました",
    };
  }
}
