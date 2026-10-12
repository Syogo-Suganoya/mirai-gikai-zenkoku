import { randomInt } from "node:crypto";

/** 読み間違えやすい文字（0/O、1/l/I など）を除いた文字 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 16;

/**
 * 管理画面のアカウントの初期パスワードを作る（設計 v3 3.4.4節）。
 * 全体管理者が本人に手渡しするので、読み間違えやすい文字を使わない。
 * 本人は初回ログインで変更する。
 */
export function generateInitialPassword(
  random: (max: number) => number = randomInt
): string {
  let password = "";
  for (let i = 0; i < LENGTH; i++) {
    password += ALPHABET[random(ALPHABET.length)];
  }
  return password;
}
