"use client";

import { sendFuriganaStateEvent } from "@/lib/analytics/preference-state-events";
import { useOnPageView } from "@/lib/analytics/use-on-page-view";
import { readFuriganaEnabled } from "./use-furigana-toggle";

/** 現在のふりがな表示設定を、ページ表示のたびに GA へ送る（レイアウトに常時置く） */
export function FuriganaStateReporter() {
  useOnPageView(() => {
    sendFuriganaStateEvent(readFuriganaEnabled());
  });
  return null;
}
