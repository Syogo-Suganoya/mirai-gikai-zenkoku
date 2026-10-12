/** 公開ファイル（サムネイルなど）の置き場所の名前を作る・読む純粋関数 */

export const THUMBNAIL_DIR = "bill-thumbnails";

/** 拡張子は英数字だけを残す（ファイル名からパスを組み立てるため） */
function safeExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
}

/** id・接頭辞も英数字・ハイフン・アンダースコアだけにする */
function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** サムネイルのキー（例: bill-thumbnails/share_<billId>_<時刻>.png） */
export function buildThumbnailKey(params: {
  fileName: string;
  billId?: string;
  prefix?: string;
  now: number;
}): string {
  const prefix = params.prefix ? `${safeSegment(params.prefix)}_` : "";
  const id = params.billId ? safeSegment(params.billId) : "new";
  return `${THUMBNAIL_DIR}/${prefix}${id}_${params.now}.${safeExtension(params.fileName)}`;
}

/**
 * 公開 URL からキーを取り出す。この置き場所（baseUrl 配下のサムネイル）の URL でなければ null。
 * 他所の URL を渡されて任意のファイルを消さないようにする。
 */
export function keyFromPublicUrl(url: string, baseUrl: string): string | null {
  const base = baseUrl.replace(/\/+$/, "");
  if (!url.startsWith(`${base}/`)) return null;
  const key = url.slice(base.length + 1);
  const pattern = new RegExp(
    `^${THUMBNAIL_DIR}/[a-zA-Z0-9_-]+\\.[a-z0-9]{1,5}$`
  );
  return pattern.test(key) ? key : null;
}
