"use server";

import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import {
  buildThumbnailKey,
  keyFromPublicUrl,
} from "@/lib/storage/public-file-key";
import { getPublicFileStorage } from "@/lib/storage/public-file-storage";

const MAX_SIZE = 5 * 1024 * 1024;

export type UploadResult = { url?: string; error?: string };
export type DeleteResult = { success: boolean; error?: string };

/** サムネイル画像を公開ファイルの置き場所（R2）に上げる */
export async function uploadThumbnailAction(
  formData: FormData
): Promise<UploadResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "ファイルがありません" };
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルを選択してください" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "ファイルサイズは5MB以下にしてください" };
  }

  try {
    const storage = getPublicFileStorage();
    const key = buildThumbnailKey({
      fileName: file.name,
      billId: String(formData.get("billId") ?? "") || undefined,
      prefix: String(formData.get("prefix") ?? "") || undefined,
      now: Date.now(),
    });
    await storage.put(key, new Uint8Array(await file.arrayBuffer()), file.type);
    return { url: `${storage.baseUrl}/${key}` };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "アップロードに失敗しました" };
  }
}

/** サムネイル画像を消す。この置き場所のサムネイル以外の URL は消さない */
export async function deleteThumbnailAction(
  url: string
): Promise<DeleteResult> {
  await requireAdmin();

  try {
    const storage = getPublicFileStorage();
    const key = keyFromPublicUrl(url, storage.baseUrl);
    if (!key) return { success: false, error: "削除できないファイルです" };
    await storage.remove(key);
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "削除に失敗しました" };
  }
}
