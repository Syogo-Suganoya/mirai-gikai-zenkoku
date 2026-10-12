import "server-only";

import { toFurigana } from "@mirai-gikai/shared/furigana/generate";
import { closeOtherPublicConfigs } from "@/features/interview-config/server/repositories/interview-config-repository";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
  type WebCacheTag,
} from "@/lib/utils/cache-invalidation";
import type { BillUpdateInput } from "../../shared/types";
import { shouldAutoCloseInterviewOnBillStatus } from "../../shared/utils/should-auto-close-interview";
import { toBillColumns } from "../../shared/utils/to-bill-columns";
import {
  findBillById,
  updateBillRecord,
} from "../repositories/bill-edit-repository";

/**
 * 議案の更新と、それに伴う副作用（件名のふりがな・インタビュー自動クローズ・キャッシュ無効化）を
 * 一括で実行する。admin の server action と MCP の update_bill ツールから共通で呼び出す。
 * 部分更新に対応するため input は Partial で受ける（undefined フィールドは更新対象外）。
 */
export async function updateBillWithSideEffects(
  id: string,
  input: Partial<BillUpdateInput>
) {
  const columns = toBillColumns(input);
  // 表示用タイトルを変えたときだけ、ふりがなを作り直す
  let nameFurigana = {};
  if (columns.name !== undefined) {
    const current = await findBillById(id);
    if (current.name !== columns.name) {
      nameFurigana = { name_furigana: await toFurigana(columns.name) };
    }
  }

  await updateBillRecord(id, { ...columns, ...nameFurigana });

  const tagsToInvalidate: WebCacheTag[] = [WEB_CACHE_TAGS.BILLS];
  if (input.status && shouldAutoCloseInterviewOnBillStatus(input.status)) {
    await closeOtherPublicConfigs(id);
    tagsToInvalidate.push(WEB_CACHE_TAGS.INTERVIEW_CONFIGS);
  }

  await invalidateWebCache(tagsToInvalidate);
}
