import type { SessionInput } from "../types";
import { validateDateRange } from "./validate-date-range";
import { validateSlug } from "./validate-slug";

/** 会期キー（CSV の突き合わせに使う）。英数字・ハイフン・アンダースコア */
const SESSION_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 会期の入力を確かめる。問題があればエラーメッセージ、なければ null。
 */
export function validateSessionInput(input: SessionInput): string | null {
  if (!input.session_key.trim()) return "会期キーを入力してください";
  if (!SESSION_KEY_PATTERN.test(input.session_key.trim())) {
    return "会期キーは半角英数字・ハイフン・アンダースコアで入力してください（例: 2026-09）";
  }
  if (!input.name.trim()) return "会期名を入力してください";
  if (!input.start_date) return "開会日を入力してください";
  if (!input.end_date) return "閉会日を入力してください";
  return (
    validateSlug(input.slug) ??
    validateDateRange(input.start_date, input.end_date)
  );
}
