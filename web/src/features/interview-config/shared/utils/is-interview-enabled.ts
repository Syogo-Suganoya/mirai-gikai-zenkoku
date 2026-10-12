/**
 * 議案でAIインタビュー（と、その意見・トピック・リアクション）を出すか。
 * 議会の設定で出すことにしていて、ダミーの議案でないときだけ出す
 * （架空の議案に住民の意見を集めない。設計 8.5.3節）。
 */
export function isInterviewEnabled(
  settings: { show_interview: boolean },
  bill: { is_dummy: boolean }
): boolean {
  return settings.show_interview && !bill.is_dummy;
}
