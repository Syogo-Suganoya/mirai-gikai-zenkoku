"use server";

import { isUniqueViolation } from "@mirai-gikai/db";
import { DummyDataExistsError } from "@mirai-gikai/shared/csv-import/dummy-handling";
import { revalidatePath } from "next/cache";
import { requireAssemblyAction } from "@/features/assemblies/server/loaders/require-assembly";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { trimOrNull } from "@/lib/utils/normalize-string";
import type { SessionInput } from "../../shared/types";
import { validateSessionInput } from "../../shared/utils/validate-session-input";
import {
  deleteSessionWithoutBills,
  insertSession,
  updateSession,
} from "../repositories/session-repository";

type ActionResult = { success: true } | { error: string };
/** 議会にダミーデータが残っている。消してよいか確認してから deleteDummyData: true で送り直す */
type CreateResult = ActionResult | { needsDummyDeletion: true };

function normalize(input: SessionInput): SessionInput {
  return {
    ...input,
    session_key: input.session_key.trim(),
    name: input.name.trim(),
    slug: trimOrNull(input.slug),
    source_url: trimOrNull(input.source_url),
  };
}

const DUPLICATE = "同じ会期キーかスラッグの会期が既にあります";

async function afterChange(assemblySlug: string) {
  revalidatePath(routes.assemblySessions(assemblySlug));
  await invalidateWebCache([WEB_CACHE_TAGS.SESSIONS, WEB_CACHE_TAGS.BILLS]);
}

/** 会期を追加する（確認者以上） */
export async function createSession(
  assemblySlug: string,
  input: SessionInput,
  options: { deleteDummyData?: boolean } = {}
): Promise<CreateResult> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug, "reviewer");
    const data = normalize(input);
    const error = validateSessionInput(data);
    if (error) return { error };

    await insertSession(assembly.id, data, options);
    await afterChange(assemblySlug);
    return { success: true };
  } catch (error) {
    if (error instanceof DummyDataExistsError) {
      return { needsDummyDeletion: true };
    }
    if (isUniqueViolation(error)) return { error: DUPLICATE };
    console.error("Create session error:", error);
    return {
      error: getErrorMessage(error, "会期の作成中にエラーが発生しました"),
    };
  }
}

/** 会期を更新する（確認者以上） */
export async function editSession(
  assemblySlug: string,
  id: string,
  input: SessionInput
): Promise<ActionResult> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug, "reviewer");
    const data = normalize(input);
    const error = validateSessionInput(data);
    if (error) return { error };

    const updated = await updateSession(assembly.id, id, data);
    if (!updated) return { error: "会期が見つかりません" };
    await afterChange(assemblySlug);
    return { success: true };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: DUPLICATE };
    console.error("Update session error:", error);
    return {
      error: getErrorMessage(error, "会期の更新中にエラーが発生しました"),
    };
  }
}

/** 会期を削除する（確認者以上）。議案がある会期は消せない */
export async function removeSession(
  assemblySlug: string,
  id: string
): Promise<ActionResult> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug, "reviewer");
    const deleted = await deleteSessionWithoutBills(assembly.id, id);
    if (!deleted) {
      return {
        error:
          "議案が登録されている会期は削除できません。先に議案を削除してください",
      };
    }
    await afterChange(assemblySlug);
    return { success: true };
  } catch (error) {
    console.error("Delete session error:", error);
    return {
      error: getErrorMessage(error, "会期の削除中にエラーが発生しました"),
    };
  }
}
