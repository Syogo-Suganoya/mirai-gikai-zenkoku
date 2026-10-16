import { createRequire } from "node:module";
import path from "node:path";
import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import { type FuriganaSegment, tokensToSegments } from "./segments";

/**
 * 文章からふりがなのセグメントを作る（サーバー・スクリプト専用）。
 * 保存するときに作って DB に入れ、表示のたびには作らない。
 */

function dictionaryPath(): string {
  // パッケージの場所から辞書を探す（Next.js のサーバーでもスクリプトでも同じ場所を指す）
  const require = createRequire(import.meta.url);
  return path.join(path.dirname(require.resolve("kuromoji/package.json")), "dict");
}

let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  // 辞書の読み込みは重いので、プロセス内で1回だけ行う
  tokenizerPromise ??= new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: dictionaryPath() }).build((err, tokenizer) => {
      if (err) {
        tokenizerPromise = null;
        reject(err);
      } else {
        resolve(tokenizer);
      }
    });
  });
  return tokenizerPromise;
}

export async function toFurigana(text: string): Promise<FuriganaSegment[]> {
  if (text === "") return [];
  const tokenizer = await getTokenizer();
  return tokensToSegments(tokenizer.tokenize(text));
}

/**
 * Markdown の本文（解説）のふりがな。
 * 段落ごとに解析し、記号（見出しの # や箇条書きの - など）はそのまま残す。
 */
export async function toFuriganaMultiline(
  text: string
): Promise<FuriganaSegment[]> {
  const lines = text.split("\n");
  const segments: FuriganaSegment[] = [];
  for (const [i, line] of lines.entries()) {
    segments.push(...(await toFurigana(line)));
    if (i < lines.length - 1) segments.push({ text: "\n" });
  }
  // 改行で区切ったふりがな無しのセグメントを結合する
  const merged: FuriganaSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (!seg.reading && last && !last.reading) last.text += seg.text;
    else merged.push({ ...seg });
  }
  return merged;
}
