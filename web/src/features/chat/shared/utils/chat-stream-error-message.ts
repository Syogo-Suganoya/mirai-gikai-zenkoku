import { isAiBusyError } from "@/lib/ai/is-ai-busy-error";

/**
 * 応答を返し始めたあとに起きたエラーを、利用者に見せる文言にする。
 * （エラーの中身はそのまま見せない。AI SDK の標準は英語の「An error occurred.」）
 */
export function chatStreamErrorMessage(error: unknown): string {
  if (isAiBusyError(error)) {
    return "AI が混み合っています。しばらく待ってから再度お試しください。";
  }
  return "エラーが発生しました。しばらく待ってから再度お試しください。";
}
