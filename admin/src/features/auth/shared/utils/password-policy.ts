/**
 * 新しいパスワードを確かめる。問題があればエラーメッセージ、なければ null。
 * 文字数などの制約は設けない（空でないこと・確認用と一致することだけ見る）。
 */
export function validateNewPassword(
  password: string,
  confirmation: string
): string | null {
  if (password === "") {
    return "新しいパスワードを入力してください";
  }
  if (password !== confirmation) {
    return "確認用のパスワードが一致しません";
  }
  return null;
}
