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
import { requireAssemblyAction } from "../loaders/require-assembly";
import { updateAssemblySettings } from "../repositories/assembly-settings-repository";

/** 議会設定を保存する（設計 v2 2.7節） */
export async function saveAssemblySettings(
  assemblySlug: string,
  input: AssemblySettingsInput
): Promise<{ success: true } | { error: string }> {
  try {
    const { assembly, settings, user } =
      await requireAssemblyAction(assemblySlug);
    const error = validateAssemblySettings(input, {
      hasMiraiMember: assembly.has_mirai_member,
      currentShowInterview: settings.show_interview,
    });
    if (error) return { error };

    const { interview_recipient_confirmed: _, ...values } = input;
    await updateAssemblySettings(assembly.id, values, user.id);

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
