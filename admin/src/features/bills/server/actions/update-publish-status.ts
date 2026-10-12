"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import type { BillPublishStatus } from "../../shared/types";
import { requireBillAction } from "../loaders/require-bill-access";
import {
  findBillById,
  updateBillPublishStatus,
} from "../repositories/bill-repository";

interface UpdatePublishStatusResult {
  success: boolean;
  error?: string;
}

// フォームアクション用のラッパー関数
export async function updatePublishStatusAction(formData: FormData) {
  const billId = formData.get("billId") as string;
  const newStatus = formData.get("newStatus") as BillPublishStatus;

  if (!billId || !newStatus) {
    throw new Error("必要なパラメータが不足しています");
  }

  // 「解説あり」の議案を公開できるのは確認者以上（設計 v2 2.8節）。件名のみの議案は編集者も公開できる
  const bill = await findBillById(billId);
  const { assembly } = await requireBillAction(
    billId,
    newStatus === "published" && bill.publish_level === "explained"
      ? "reviewer"
      : "editor"
  );

  const result = await _updateBillPublishStatus(billId, newStatus);

  if (!result.success) {
    throw new Error(result.error || "ステータスの更新に失敗しました");
  }

  revalidatePath(routes.assemblyBills(assembly.slug));
}

async function _updateBillPublishStatus(
  billId: string,
  publishStatus: BillPublishStatus
): Promise<UpdatePublishStatusResult> {
  try {
    await updateBillPublishStatus(billId, publishStatus);

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    console.error("Error updating publish status:", error);
    return {
      success: false,
      error: "ステータスの更新に失敗しました",
    };
  }
}
