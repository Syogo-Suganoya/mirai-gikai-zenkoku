"use server";

import { revalidatePath } from "next/cache";
import { requireAssemblyAction } from "@/features/assemblies/server/loaders/require-assembly";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { BillPublishStatus } from "../../shared/types";
import { planBulkPublishStatus } from "../../shared/utils/plan-bulk-publish";
import {
  findAssemblyBillsByIds,
  updateBillsPublishStatus,
} from "../repositories/bill-repository";

type BulkUpdateResult =
  | { success: true; updatedCount: number; unchangedCount: number }
  | { error: string };

/**
 * 選んだ議案の公開状態をまとめて変える（CSV で取り込んだ件名のみの議案の公開など）。
 */
export async function bulkUpdatePublishStatus(
  assemblySlug: string,
  billIds: string[],
  newStatus: BillPublishStatus
): Promise<BulkUpdateResult> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug);
    const uniqueIds = [...new Set(billIds)];
    if (uniqueIds.length === 0) return { error: "議案を選んでください" };

    const bills = await findAssemblyBillsByIds(assembly.id, uniqueIds);
    if (bills.length !== uniqueIds.length) {
      return { error: "この議会の議案ではないものが含まれています" };
    }
    const plan = planBulkPublishStatus(bills, newStatus);

    await updateBillsPublishStatus(assembly.id, plan.targetIds, newStatus);
    revalidatePath(routes.assemblyBills(assembly.slug));
    if (plan.targetIds.length > 0) {
      await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    }
    return {
      success: true,
      updatedCount: plan.targetIds.length,
      unchangedCount: plan.unchangedCount,
    };
  } catch (error) {
    console.error("Bulk update publish status error:", error);
    return {
      error: getErrorMessage(error, "公開状態の変更中にエラーが発生しました"),
    };
  }
}
