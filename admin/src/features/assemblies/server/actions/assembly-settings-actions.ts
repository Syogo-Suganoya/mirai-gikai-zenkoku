"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { AssemblySettingsInput } from "../../shared/types";
import { validateAssemblySettings } from "../../shared/utils/validate-assembly-settings";
import { hasDummyCounts } from "../../shared/utils/dummy-data-counts";
import { requireAssemblyAction } from "../loaders/require-assembly";
import { updateAssemblySettings } from "../repositories/assembly-settings-repository";
import { countDummyData } from "../repositories/dummy-data-repository";

/** 議会設定を保存する */
export async function saveAssemblySettings(
  assemblySlug: string,
  input: AssemblySettingsInput
): Promise<{ success: true } | { error: string }> {
  try {
    const { assembly, user } = await requireAssemblyAction(assemblySlug);
    const error = validateAssemblySettings(input, {
      hasMiraiMember: assembly.has_mirai_member,
      hasDummyData: hasDummyCounts(await countDummyData(assembly.id)),
    });
    if (error) return { error };

    await updateAssemblySettings(assembly.id, input, user.id);

    revalidatePath(routes.assemblySettings(assemblySlug));
    // 設定は公開側の全ページで読む（議会のキャッシュに含まれる）
    await invalidateWebCache([
      WEB_CACHE_TAGS.ASSEMBLIES,
      WEB_CACHE_TAGS.BILLS,
      WEB_CACHE_TAGS.INTERVIEW_CONFIGS,
    ]);
    return { success: true };
  } catch (error) {
    console.error("Save assembly settings error:", error);
    return {
      error: getErrorMessage(error, "議会設定の保存中にエラーが発生しました"),
    };
  }
}
