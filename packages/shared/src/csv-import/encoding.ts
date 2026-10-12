/**
 * CSV のバイト列の文字コードを判定して文字列にする。
 * Excel で保存した CSV は Shift_JIS が多いので、UTF-8 として正しく読めなければ Shift_JIS とみなす。
 */

export type CsvEncoding = "utf-8" | "shift_jis";

export function detectEncoding(bytes: Uint8Array): CsvEncoding {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8";
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "utf-8";
  } catch {
    return "shift_jis";
  }
}

/** 判定した文字コードで読み、BOM を除いた文字列を返す */
export function decodeCsv(bytes: Uint8Array): {
  text: string;
  encoding: CsvEncoding;
} {
  const encoding = detectEncoding(bytes);
  const text = new TextDecoder(encoding).decode(bytes).replace(/^﻿/, "");
  return { text, encoding };
}
