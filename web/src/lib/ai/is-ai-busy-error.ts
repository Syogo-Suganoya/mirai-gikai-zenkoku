import { APICallError, RetryError } from "ai";

/** 混雑・一時的な上限で返る HTTP ステータス（Gemini は 503・429 を返す） */
const BUSY_STATUS_CODES = new Set([429, 503]);

/**
 * AI の API が混み合っていて失敗したかを判定する。
 * AI SDK は自動でやり直したあと RetryError で包むので、最後のエラーも見る。
 */
export function isAiBusyError(error: unknown): boolean {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return (
    APICallError.isInstance(cause) &&
    cause.statusCode !== undefined &&
    BUSY_STATUS_CODES.has(cause.statusCode)
  );
}
