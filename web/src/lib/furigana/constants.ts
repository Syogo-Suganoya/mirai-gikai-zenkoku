/** ふりがな表示の設定（選んだ状態）を残す Cookie */
export const FURIGANA_COOKIE_NAME = "furigana";
export const FURIGANA_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** html 要素の data 属性。CSS でふりがな（rt）の表示・非表示を切り替える */
export const FURIGANA_DATA_ATTRIBUTE = "data-furigana";

/** Cookie の値からふりがな表示の設定を読む */
export function isFuriganaOn(cookieValue: string | undefined | null): boolean {
  return cookieValue === "on";
}

/** document.cookie の文字列からふりがな表示の設定を読む */
export function isFuriganaOnInCookieString(cookieString: string): boolean {
  return cookieString
    .split(";")
    .some((part) => part.trim() === `${FURIGANA_COOKIE_NAME}=on`);
}

/**
 * 描画の前に html 要素へ設定を反映するスクリプト（root layout の head に置く）。
 * サーバーで Cookie を読まないので、ページを静的に配信できる。
 */
export const FURIGANA_INIT_SCRIPT = `document.documentElement.setAttribute("${FURIGANA_DATA_ATTRIBUTE}", document.cookie.split(";").some(function(c){return c.trim()==="${FURIGANA_COOKIE_NAME}=on"})?"on":"off");`;
