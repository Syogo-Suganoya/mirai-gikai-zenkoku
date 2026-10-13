"use server";

import { requireUser } from "@/features/auth/server/lib/session";
import { requireBillAction } from "@/features/bills/server/loaders/require-bill-access";
import {
  billIdFromThumbnailKey,
  buildThumbnailKey,
} from "@/lib/storage/public-file-key";

/** 議案のサムネイルは議案があるか確かめる。議案を作る前の画像はログインだけ確かめる */
async function requireThumbnailAccess(billId: string | null) {
  if (billId) await requireBillAction(billId);
  else await requireUser();
}

import { getPublicFileStorage } from "@/lib/storage/public-file-storage";

const MAX_SIZE = 5 * 1024 * 1024;

export type UploadResult = { url?: string; error?: string };
export type DeleteResult = { success: boolean; error?: string };

/** サムネイル画像を公開ファイルの置き場所（Vercel Blob）に上げる */
export async function uploadThumbnailAction(
  formData: FormData
): Promise<UploadResult> {
  const billId = String(formData.get("billId") ?? "") || null;
  await requireThumbnailAccess(billId);

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
      billId: billId ?? undefined,
      prefix: String(formData.get("prefix") ?? "") || undefined,
      now: Date.now(),
    });
    const url = await storage.put(
      key,
      new Uint8Array(await file.arrayBuffer()),
      file.type
    );
    return { url };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "アップロードに失敗しました" };
  }
}

/** サムネイル画像を消す。この置き場所のサムネイル以外の URL は消さない */
export async function deleteThumbnailAction(
  url: string
): Promise<DeleteResult> {
  const storage = getPublicFileStorage();
  const key = storage.thumbnailKeyFromUrl(url);
  if (!key) return { success: false, error: "削除できないファイルです" };
  await requireThumbnailAccess(billIdFromThumbnailKey(key));

  try {
    await storage.remove(url);
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "削除に失敗しました" };
  }
}
