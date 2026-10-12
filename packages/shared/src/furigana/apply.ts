import type { FuriganaSegment } from "./segments";

/**
 * 保存済みのふりがな（本文全体のセグメント）を、表示する文章の一部分に当てるための純粋関数。
 *
 * Markdown の解説は、描画すると見出しの「#」や強調の「**」が消え、文章が要素ごとに分かれる。
 * そのため保存したセグメントの位置をそのまま使わず、「漢字 → 読み」の辞書にして、
 * 描画後の文章の各部分に最長一致で当てる。
 */

export type ReadingDictionary = {
  readings: ReadonlyMap<string, string>;
  /** 長い語から順に試すための見出し語の長さ（降順） */
  lengths: readonly number[];
};

/** セグメントから「漢字 → 読み」の辞書を作る。同じ語は最初に出た読みを使う */
export function buildReadingDictionary(
  segments: readonly FuriganaSegment[] | null | undefined
): ReadingDictionary {
  const readings = new Map<string, string>();
  for (const segment of segments ?? []) {
    if (segment.reading && !readings.has(segment.text)) {
      readings.set(segment.text, segment.reading);
    }
  }
  const lengths = [...new Set([...readings.keys()].map((k) => k.length))].sort(
    (a, b) => b - a
  );
  return { readings, lengths };
}

/** 文章に辞書の読みを当ててセグメントにする（読みの無い部分は結合する） */
export function applyReadings(
  text: string,
  dictionary: ReadingDictionary
): FuriganaSegment[] {
  if (dictionary.readings.size === 0) return text ? [{ text }] : [];

  const segments: FuriganaSegment[] = [];
  let plain = "";
  let i = 0;
  outer: while (i < text.length) {
    for (const length of dictionary.lengths) {
      const word = text.slice(i, i + length);
      const reading =
        word.length === length ? dictionary.readings.get(word) : undefined;
      if (reading) {
        if (plain) {
          segments.push({ text: plain });
          plain = "";
        }
        segments.push({ text: word, reading });
        i += length;
        continue outer;
      }
    }
    plain += text[i];
    i++;
  }
  if (plain) segments.push({ text: plain });
  return segments;
}
