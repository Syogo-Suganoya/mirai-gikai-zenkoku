/**
 * インタビューの回答がトピック分析の対象になるか（住民が公開を許可し、管理者側でも公開されている）。
 * 分析は公開された意見だけを使うので、それ以外では分析を動かさない（AI の呼び出しを無駄にしない）。
 */
export function isReportAnalyzable(report: {
  is_public_by_user: boolean;
  is_public_by_admin: boolean;
}): boolean {
  return report.is_public_by_user && report.is_public_by_admin;
}
