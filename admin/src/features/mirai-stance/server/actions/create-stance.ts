"use server";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type StanceInput, stanceInputSchema } from "../../shared/types";
import { requireStanceAction } from "../loaders/require-stance-access";
import { createMiraiStance } from "../repositories/mirai-stance-repository";

export async function createStance(billId: string, data: StanceInput) {
  try {
    await requireStanceAction({ billId });
    await createMiraiStance(billId, stanceInputSchema.parse(data));

    invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
    return { success: true };
  } catch (error) {
    console.error("Error in createStance:", error);
    return {
      success: false,
      error: getErrorMessage(error, "予期しないエラーが発生しました"),
    };
  }
}
