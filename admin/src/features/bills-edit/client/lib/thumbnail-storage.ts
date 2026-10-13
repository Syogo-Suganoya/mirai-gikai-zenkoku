import {
  type DeleteResult,
  deleteThumbnailAction,
  type UploadResult,
  uploadThumbnailAction,
} from "../../server/actions/thumbnail-actions";

export type { DeleteResult, UploadResult };

/** サムネイル画像を公開ファイルの置き場所（Vercel Blob）にアップロード */
export async function uploadThumbnail(
  file: File,
  billId?: string,
  storagePrefix?: string
): Promise<UploadResult> {
  // 送る前にも確かめる（大きいファイルを送ってから断らない）
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルを選択してください" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "ファイルサイズは5MB以下にしてください" };
  }

  const formData = new FormData();
  formData.set("file", file);
  if (billId) formData.set("billId", billId);
  if (storagePrefix) formData.set("prefix", storagePrefix);
  return uploadThumbnailAction(formData);
}

/** サムネイル画像を削除 */
export function deleteThumbnail(url: string): Promise<DeleteResult> {
  return deleteThumbnailAction(url);
}
