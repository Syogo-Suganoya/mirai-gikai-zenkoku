/**
 * 形態素解析の結果を、ふりがな表示用のセグメントに変換する純粋関数。
 * 移行元（みらい議会＠愛知・名古屋）の lib/furigana.ts を移したもの。
 *
 * - ふりがなは漢字の部分だけに振り、送り仮名には振らない
 * - text を順に連結すると元の文章と一致する
 */

import type { FuriganaSegment } from "@mirai-gikai/db";

export type { FuriganaSegment };

/** 形態素解析のトークン（kuromoji の IpadicFeatures のうち使う項目） */
export type FuriganaToken = {
  surface_form: string;
  reading?: string;
};

const KANJI_RE = /[一-鿿々]/;

// kuromoji(IPADIC)が文脈によって誤読しやすい語の補正辞書。
// 例: 「令和」の「令」が単独トークン化されると「りょう」と誤読されることがあるため固定する。
const FORCED_READINGS: Record<string, string> = {
  令: "れい",
};

export function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// 送り仮名を含むトークン(例: 「育てよう」)を漢字部分と仮名部分に分割し、
// 漢字部分にだけ読みを割り当てる。
// 「(.+?)」を漢字の連続部分、リテラルを非漢字の連続部分としたパターンを作り、
// 読み(ひらがな)全体に対して正規表現マッチさせることで、位置ズレなく対応させる。
export function splitTokenFurigana(
  surface: string,
  reading: string
): FuriganaSegment[] {
  const runRe = /([一-鿿々]+|[^一-鿿々]+)/g;
  const runs: { text: string; isKanji: boolean }[] = [];
  for (const m of surface.matchAll(runRe)) {
    runs.push({ text: m[0], isKanji: KANJI_RE.test(m[0][0]) });
  }

  if (runs.every((r) => !r.isKanji) || runs.every((r) => r.isKanji)) {
    return [{ text: surface, reading }];
  }

  let pattern = "^";
  for (const run of runs) {
    pattern += run.isKanji
      ? "(.+?)"
      : run.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  pattern += "$";

  const match = reading.match(new RegExp(pattern));
  if (!match) {
    // 位置合わせに失敗した場合はトークン全体に読みを振る
    return [{ text: surface, reading }];
  }

  const segments: FuriganaSegment[] = [];
  let groupIndex = 1;
  for (const run of runs) {
    if (run.isKanji) {
      const r = match[groupIndex++];
      segments.push(
        r && r !== run.text ? { text: run.text, reading: r } : { text: run.text }
      );
    } else {
      segments.push({ text: run.text });
    }
  }
  return segments;
}

export function tokensToSegments(tokens: FuriganaToken[]): FuriganaSegment[] {
  const raw: FuriganaSegment[] = tokens.flatMap((token) => {
    const surface = token.surface_form;
    if (surface in FORCED_READINGS) {
      return [{ text: surface, reading: FORCED_READINGS[surface] }];
    }
    if (KANJI_RE.test(surface) && token.reading && token.reading !== "*") {
      const reading = katakanaToHiragana(token.reading);
      if (reading !== surface) {
        return splitTokenFurigana(surface, reading);
      }
    }
    return [{ text: surface }];
  });

  // 連続する「ふりがな無し」セグメントは結合して配列を読みやすくする
  const merged: FuriganaSegment[] = [];
  for (const seg of raw) {
    const last = merged[merged.length - 1];
    if (!seg.reading && last && !last.reading) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }
  return merged;
}

/** セグメントを連結して元の文章に戻す */
export function segmentsToText(segments: readonly FuriganaSegment[]): string {
  return segments.map((s) => s.text).join("");
}

/**
 * 「漢字(よみ)」を区切りで並べた手入力の形（議案登録画面の件名のふりがな修正）と、
 * セグメントの相互変換。例: `令和(れいわ)8年度(ねんど)` 。
 */
export function segmentsToEditableText(
  segments: readonly FuriganaSegment[]
): string {
  return segments
    .map((s) => (s.reading ? `${s.text}(${s.reading})` : s.text))
    .join("");
}

export function editableTextToSegments(text: string): FuriganaSegment[] {
  const segments: FuriganaSegment[] = [];
  const re = /([一-鿿々]+)[(（]([ぁ-ゖー]+)[)）]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const index = m.index ?? 0;
    if (index > last) segments.push({ text: text.slice(last, index) });
    segments.push({ text: m[1], reading: m[2] });
    last = index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments;
}
