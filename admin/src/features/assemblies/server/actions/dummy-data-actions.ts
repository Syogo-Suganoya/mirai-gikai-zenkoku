"use server";

import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type DummyDataCounts,
  describeDummyCounts,
} from "../../shared/utils/dummy-data-counts";
import { requireAssemblyAction } from "../loaders/require-assembly";
import { deleteAssemblyDummyData } from "../repositories/dummy-data-repository";

/** 議会のダミーデータを消す（設計 v3 8.5.4節） */
export async function removeAssemblyDummyData(
  assemblySlug: string
): Promise<{ success: true; message: string } | { error: string }> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug);
    const deleted = await deleteAssemblyDummyData(assembly.id);
    const counts: DummyDataCounts = {
      sessions: deleted.sessionCount,
      bills: deleted.billCount,
      factions: deleted.factionCount,
    };

    for (const path of [
      routes.assemblySettings(assembly.slug),
      routes.assemblyBills(assembly.slug),
      routes.assemblySessions(assembly.slug),
    ]) {
      revalidatePath(path);
    }
    await invalidateWebCache([
      WEB_CACHE_TAGS.ASSEMBLIES,
      WEB_CACHE_TAGS.BILLS,
      WEB_CACHE_TAGS.SESSIONS,
    ]);
    const described = describeDummyCounts(counts);
    return {
      success: true,
      message: described
        ? `ダミーデータ（${described}）を削除しました`
        : "削除するダミーデータはありませんでした",
    };
  } catch (error) {
    console.error("Remove dummy data error:", error);
    return {
      error: getErrorMessage(
        error,
        "ダミーデータの削除中にエラーが発生しました"
      ),
    };
  }
}
