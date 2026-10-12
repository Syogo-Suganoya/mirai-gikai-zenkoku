import { routes } from "@/lib/routes";

/*
 * 議案・インタビューのページは議会の下にある（/[assembly]/bills/[billKey]/...）。
 * billKey は議案の slug か id（billKey(bill)）。
 */

/**
 * 議案詳細ページへのリンクを取得
 */
export function getBillDetailLink(
  assemblySlug: string,
  billKey: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewBillDetail(assemblySlug, billKey, previewToken);
  }
  return routes.billDetail(assemblySlug, billKey);
}

/**
 * インタビューLPページへのリンクを取得
 */
export function getInterviewLPLink(
  assemblySlug: string,
  billKey: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewInterviewLP(assemblySlug, billKey, previewToken);
  }
  return routes.interviewLP(assemblySlug, billKey);
}

/**
 * インタビュー情報開示ページへのリンクを取得
 */
export function getInterviewDisclosureLink(
  assemblySlug: string,
  billKey: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewInterviewDisclosure(
      assemblySlug,
      billKey,
      previewToken
    );
  }
  return routes.interviewDisclosure(assemblySlug, billKey);
}

/**
 * インタビューチャットページへのリンクを取得
 */
export function getInterviewChatLink(
  assemblySlug: string,
  billKey: string,
  previewToken?: string
): string {
  if (previewToken) {
    return routes.previewInterviewChat(assemblySlug, billKey, previewToken);
  }
  return routes.interviewChat(assemblySlug, billKey);
}

/**
 * インタビュー完了レポートページへのリンクを取得
 */
export function getInterviewReportCompleteLink(reportId: string): string {
  return routes.reportComplete(reportId);
}

/**
 * 公開レポートページへのリンクを取得
 * @param from - 遷移元のコンテキスト。"opinions" の場合、戻るボタンがレポート一覧を指す
 */
export function getPublicReportLink(
  reportId: string,
  from?: "opinions"
): string {
  const base = routes.publicReport(reportId);
  if (from) {
    return `${base}?from=${from}`;
  }
  return base;
}

function getReportLinkForChatLogContext(
  reportId: string,
  from?: "complete" | "opinions"
): string {
  if (from === "complete") {
    return routes.reportComplete(reportId);
  }
  if (from === "opinions") {
    return getPublicReportLink(reportId, "opinions");
  }
  return routes.publicReport(reportId);
}

/**
 * インタビュー会話ログの表示先へのリンクを取得
 * @param from - 遷移元のコンテキスト。"complete" の場合は完了ページ内、"opinions" の場合は公開レポート一覧からの戻り文脈を維持する
 */
export function getInterviewChatLogLink(
  reportId: string,
  from?: "complete" | "opinions"
): string {
  return `${getReportLinkForChatLogContext(reportId, from)}#chat-log`;
}

/**
 * インタビュー会話ログ内の個別メッセージへのリンクを取得
 * @param from - 遷移元のコンテキスト。"complete" の場合は完了ページ内、"opinions" の場合は公開レポート一覧からの戻り文脈を維持する
 * @param quote - 引用文（逐語）。指定すると `?quote=` で渡し、レポート側で該当メッセージ内の該当部分を太字表示する。
 *   このとき `?mid=`（メッセージID）も併せて渡し、ハイライト対象を該当メッセージ1件に限定する
 *   （テキスト一致だけだと無関係なメッセージまで太字になるため）。
 */
export function getInterviewMessageLink(
  reportId: string,
  messageId: string,
  from?: "complete" | "opinions",
  quote?: string | null
): string {
  const base = getReportLinkForChatLogContext(reportId, from);
  const sep = base.includes("?") ? "&" : "?";
  const query = quote
    ? `${sep}quote=${encodeURIComponent(quote)}&mid=${encodeURIComponent(messageId)}`
    : "";
  return `${base}${query}#message-${messageId}`;
}
