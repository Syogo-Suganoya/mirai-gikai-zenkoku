"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { requireBillAction } from "../loaders/require-bill-access";
import { deleteBillById } from "../repositories/bill-repository";

export async function deleteBill(id: string) {
  try {
    // 削除は確認者以上
    const { assembly } = await requireBillAction(id, "reviewer");

    // 議案を削除
    await deleteBillById(id);

    // キャッシュをリフレッシュ
    revalidatePath(routes.assemblyBills(assembly.slug));
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
  } catch (error) {
    console.error("Delete bill error:", error);
    throw new Error(
      getErrorMessage(error, "議案の削除中にエラーが発生しました")
    );
  }
}
