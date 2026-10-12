/**
 * インタビューチャットで選択可能なAIモデルの定義
 * Gemini API を直接呼ぶ（設計 v3 4章）ので、選べるのは @mirai-gikai/shared の GEMINI_MODELS だけ
 */

import { type AiModel, GEMINI_MODELS } from "@mirai-gikai/shared/ai/models";
import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import {
  estimateInterviewCostUsd,
  formatEstimatedCost,
} from "./estimate-interview-cost";

type ChatModelOption = {
  value: string;
  label: string;
  estimatedCost: string | null;
};

export type ChatModelGroup = {
  provider: string;
  options: ChatModelOption[];
};

/** フラットなモデル一覧（バリデーション用） */
export const CHAT_MODEL_OPTIONS = (
  Object.entries(GEMINI_MODELS) as [AiModel, { label: string }][]
).map(([value, model]) => ({ value, label: model.label }));

export type ChatModelValue = AiModel;

function buildGroupOptions(
  models: ReadonlyArray<{ value: string; label: string }>
): ChatModelOption[] {
  return models.map((m) => {
    const cost = estimateInterviewCostUsd(m.value);
    return {
      value: m.value,
      label: m.label,
      estimatedCost: cost !== null ? formatEstimatedCost(cost) : null,
    };
  });
}

/** プロバイダー別にグループ化されたモデル一覧（UI表示用） */
export const CHAT_MODEL_GROUPS: ChatModelGroup[] = [
  { provider: "Google", options: buildGroupOptions(CHAT_MODEL_OPTIONS) },
];

/** 文字列が有効なチャットモデルIDかどうかを検証する */
export function isValidChatModel(model: string): model is ChatModelValue {
  return CHAT_MODEL_OPTIONS.some((opt) => opt.value === model);
}

/** デフォルトモデルの表示ラベル（例: "Gemini 3.8 Flash ~14円/回"） */
export const DEFAULT_MODEL_LABEL = (() => {
  const model = CHAT_MODEL_OPTIONS.find(
    (opt) => opt.value === DEFAULT_INTERVIEW_CHAT_MODEL
  );
  const cost = estimateInterviewCostUsd(DEFAULT_INTERVIEW_CHAT_MODEL);
  const costStr = cost !== null ? ` ${formatEstimatedCost(cost)}/回` : "";
  return `${model?.label ?? DEFAULT_INTERVIEW_CHAT_MODEL}${costStr}`;
})();
