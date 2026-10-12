"use client";

import { useEffect, useState } from "react";
import {
  FURIGANA_COOKIE_MAX_AGE,
  FURIGANA_COOKIE_NAME,
  FURIGANA_DATA_ATTRIBUTE,
} from "./constants";

/** 現在の表示設定（html の data 属性） */
export function readFuriganaEnabled(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.getAttribute(FURIGANA_DATA_ATTRIBUTE) === "on"
  );
}

/**
 * ふりがな表示の切り替え。Cookie に残し、html の data 属性を書き換えてすぐに反映する
 * （ふりがなは描画済みなので、ページの再読み込みはしない）。
 */
export function useFuriganaToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readFuriganaEnabled());
  }, []);

  const toggle = (checked: boolean) => {
    setEnabled(checked);
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API は Safari が未対応のため document.cookie を使う
    document.cookie = `${FURIGANA_COOKIE_NAME}=${checked ? "on" : "off"}; path=/; max-age=${FURIGANA_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.setAttribute(
      FURIGANA_DATA_ATTRIBUTE,
      checked ? "on" : "off"
    );
  };

  return { enabled, toggle };
}
