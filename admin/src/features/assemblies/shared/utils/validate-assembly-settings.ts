import { VOTE_GRANULARITY_LABELS } from "@mirai-gikai/shared/csv-import/types";
import type { AssemblySettingsInput } from "../types";

const PUBLISH_LEVELS = ["title_only", "explained"];

/**
 * 議会設定の入力を確かめる（設計 v2 2.7節の制約）。問題が無ければ null。
 * - チームみらいのスタンスは、議員がいる議会（has_mirai_member）でだけ出せる
 * - AIインタビューを新しく出すときは、届け先の議員がいることの確認が要る
 */
export function validateAssemblySettings(
  input: AssemblySettingsInput,
  context: { hasMiraiMember: boolean; currentShowInterview: boolean }
): string | null {
  if (!(input.vote_granularity in VOTE_GRANULARITY_LABELS)) {
    return "議決結果の粒度を選んでください";
  }
  if (!PUBLISH_LEVELS.includes(input.default_publish_level)) {
    return "新しい議案の掲載のしかたを選んでください";
  }
  if (input.show_mirai_stance && !context.hasMiraiMember) {
    return "チームみらいの議員がいない議会では、スタンスを出せません";
  }
  if (
    input.show_interview &&
    !context.currentShowInterview &&
    !input.interview_recipient_confirmed
  ) {
    return "AIインタビューを出すには、意見の届け先（議員）がいることを確認してください";
  }
  return null;
}

export type FeatureVisibility = "shown" | "hidden_no_data" | "off";

/** 設定がオンでもデータが0件なら公開側には出さない（設計 v2 2.7節） */
export function featureVisibility(
  enabled: boolean,
  dataCount: number
): FeatureVisibility {
  if (!enabled) return "off";
  return dataCount > 0 ? "shown" : "hidden_no_data";
}
