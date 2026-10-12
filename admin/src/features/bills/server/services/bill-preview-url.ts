import "server-only";

import { env } from "@/lib/env";
import { buildPreviewUrl } from "@/lib/utils/build-preview-url";
import { webBillPreviewPath } from "@/lib/utils/web-bill-paths";
import { findBillAssembly } from "../repositories/bill-repository";
import { previewTokenService } from "./preview-token-service";

/**
 * 議案のプレビュー URL（公開サイトの下書き表示）を作る。
 * suffix は "" なら議案ページ、"/interview" ならインタビューの入口。
 */
export async function getBillPreviewUrl(billId: string, suffix = "") {
  const billAssembly = await findBillAssembly(billId);
  if (!billAssembly) throw new Error("議案が見つかりません");
  const tokenInfo = await previewTokenService.getOrCreateToken(billId);
  return {
    url: buildPreviewUrl(
      env.webUrl,
      // プレビューは下書きを見るので、slug が変わっても届く id を使う
      webBillPreviewPath(billAssembly.slug, billId, suffix),
      tokenInfo.token
    ),
    token: tokenInfo.token,
    expiresAt: tokenInfo.expiresAt,
  };
}
