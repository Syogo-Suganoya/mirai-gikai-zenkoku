/**
 * 公開サイト（web）の議案ページのパス。web の lib/routes.ts と同じ形にそろえる。
 * 議案は議会ごとの URL（/[assembly]/bills/[議案の slug か id]）にある。
 */

/** suffix は "" / "/interview" など、議案ページの下のパス */
export function webBillPath(
  assemblySlug: string,
  billKey: string,
  suffix = ""
): string {
  return `/${assemblySlug}/bills/${encodeURIComponent(billKey)}${suffix}`;
}

/** プレビュー（下書きの議案をトークン付きで見る）のパス */
export function webBillPreviewPath(
  assemblySlug: string,
  billKey: string,
  suffix = ""
): string {
  return `/preview${webBillPath(assemblySlug, billKey, suffix)}`;
}
