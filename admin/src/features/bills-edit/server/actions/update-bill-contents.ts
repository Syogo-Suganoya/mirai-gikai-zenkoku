"use server";

import { toFuriganaMultiline } from "@mirai-gikai/shared/furigana/generate";
import { requireBillAction } from "@/features/bills/server/loaders/require-bill-access";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import {
  type BillContentsUpdateInput,
  billContentsUpdateSchema,
  type DifficultyLevel,
} from "../../shared/types/bill-contents";
import { upsertBillContent } from "../repositories/bill-edit-repository";

export type UpdateBillContentsResult =
  | { success: true }
  | { success: false; error: string };

export async function updateBillContents(
  billId: string,
  input: BillContentsUpdateInput
): Promise<UpdateBillContentsResult> {
  try {
    await requireBillAction(billId);

    // バリデーション
    const validatedData = billContentsUpdateSchema.parse(input);

    // 各難易度レベルのupsertを並行実行
    const upsertPromises = (["normal", "hard"] as DifficultyLevel[]).map(
      async (difficulty) => {
        const data = validatedData[difficulty];

        // 空のコンテンツの場合はスキップ（削除も行わない）
        if (!data.title && !data.summary && !data.content) {
          return;
        }

        await upsertBillContent({
          billId,
          difficultyLevel: difficulty,
          title: data.title || "",
          summary: data.summary || "",
          content: data.content || "",
          // 本文のふりがなは保存時に作る（表示のたびには作らない。設計 v3 7.1節）
          furigana: await toFuriganaMultiline(data.content || ""),
        });
      }
    );

    await Promise.all(upsertPromises);

    // web側のキャッシュを無効化
    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);

    return { success: true };
  } catch (error) {
    console.error("Update bill contents error:", error);
    return {
      success: false,
      error: getErrorMessage(
        error,
        "議案コンテンツの更新中にエラーが発生しました"
      ),
    };
  }
}
