import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

/**
 * モデル ID（"gemini-3.8-flash" など）から Gemini API のモデルを作る。
 * API キーは GOOGLE_GENERATIVE_AI_API_KEY から読まれる。
 *
 * 本家は AI Gateway 形式の文字列をそのまま渡していたが、v3 では Gemini API を直接呼ぶため、
 * generateText / streamText / generateObject の `model` には必ずこれを通した値を渡す。
 */
export function geminiModel(modelId: string): LanguageModel {
  return google(modelId);
}
