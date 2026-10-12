"use server";

import { todayInJapan } from "@mirai-gikai/shared/bill-results/factions";
import { revalidatePath } from "next/cache";
import { requireBillAction } from "@/features/bills/server/loaders/require-bill-access";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { BillResultFormValues } from "../../shared/types";
import { parseBillResultInput } from "../../shared/utils/bill-result-input";
import {
  deleteBillResultRecord,
  findAssemblyFactions,
  saveBillResultRecord,
} from "../repositories/bill-result-repository";

type ActionResult = { success: true } | { error: string };

async function afterChange(billId: string) {
  revalidatePath(routes.billEdit(billId));
  await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
}

/** 議決結果と会派ごとの賛否を保存する（設計 v3 6.1節） */
export async function saveBillResult(
  billId: string,
  values: BillResultFormValues
): Promise<ActionResult> {
  try {
    const { assembly, settings } = await requireBillAction(billId);
    const parsed = parseBillResultInput(values, {
      granularity: settings.vote_granularity,
      factions: await findAssemblyFactions(assembly.id),
      today: todayInJapan(),
    });
    if (!parsed.ok) return { error: parsed.error };

    await saveBillResultRecord(billId, parsed.value, parsed.factionVotes);
    await afterChange(billId);
    return { success: true };
  } catch (error) {
    console.error("Save bill result error:", error);
    return {
      error: getErrorMessage(error, "議決結果の保存中にエラーが発生しました"),
    };
  }
}

/** 議決結果を消す */
export async function removeBillResult(billId: string): Promise<ActionResult> {
  try {
    await requireBillAction(billId);
    await deleteBillResultRecord(billId);
    await afterChange(billId);
    return { success: true };
  } catch (error) {
    console.error("Remove bill result error:", error);
    return {
      error: getErrorMessage(error, "議決結果の削除中にエラーが発生しました"),
    };
  }
}
