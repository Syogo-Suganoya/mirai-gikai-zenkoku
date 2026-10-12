/**
 * AI モデルの定義（Gemini API を直接呼ぶ）。
 *
 * 呼び出し側は用途名（AI_MODELS.chat など）で参照する。モデル名は Gemini の提供状況に
 * 合わせてこのファイルだけを変える。単価は https://ai.google.dev/gemini-api/docs/pricing
 */

/** 使える Gemini のモデル ID と表示名・単価（USD / 100万トークン） */
export const GEMINI_MODELS = {
  "gemini-3.8-flash": {
    label: "Gemini 3.8 Flash",
    inputTokensPerMillionUsd: 0.75,
    outputTokensPerMillionUsd: 3.75,
  },
  "gemini-3.5-flash-lite": {
    label: "Gemini 3.5 Flash-Lite",
    inputTokensPerMillionUsd: 0.3,
    outputTokensPerMillionUsd: 2.5,
  },
  "gemini-3.1-pro-preview": {
    label: "Gemini 3.1 Pro Preview",
    inputTokensPerMillionUsd: 2,
    outputTokensPerMillionUsd: 12,
  },
} as const;

export type AiModel = keyof typeof GEMINI_MODELS;

const FLASH: AiModel = "gemini-3.8-flash";
const PRO: AiModel = "gemini-3.1-pro-preview";

/** 用途ごとのモデル。速さが要る用途は Flash、質が要る用途は Pro */
export const AI_MODELS = {
  chat: FLASH,
  interview: FLASH,
  moderation: FLASH,
  contentRichness: FLASH,
  report: PRO,
  opinionBackfill: PRO,
  topicAnalysis: PRO,
  interviewConfig: PRO,
  simulation: FLASH,
  billSplit: PRO,
  billDraft: PRO,
} as const satisfies Record<string, AiModel>;

export type AiPurpose = keyof typeof AI_MODELS;

/** 文字列が登録済みのモデル ID かどうかを判定する。 */
export function isKnownModel(model: string): model is AiModel {
  return Object.hasOwn(GEMINI_MODELS, model);
}

/** インタビューチャットのデフォルトモデル */
export const DEFAULT_INTERVIEW_CHAT_MODEL = AI_MODELS.interview;
/** モデレーション評価のデフォルトモデル */
export const DEFAULT_MODERATION_MODEL = AI_MODELS.moderation;
/** コンテンツ充実度評価のデフォルトモデル */
export const DEFAULT_CONTENT_RICHNESS_MODEL = AI_MODELS.contentRichness;
/** 意見バックフィル（再抽出）のデフォルトモデル */
export const DEFAULT_OPINION_BACKFILL_MODEL = AI_MODELS.opinionBackfill;
