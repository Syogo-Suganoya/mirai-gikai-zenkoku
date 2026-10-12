/**
 * 実データを取り込むときの、その議会のダミーデータの扱い（8.5.4節）。
 * 1つの議会に実データとダミーを並べないため、ダミーが残っていれば消してから取り込む。
 * 消すのは、利用者が確認モーダルなどで同意したときだけ。
 * - none: ダミーがないのでそのまま取り込む
 * - delete: ダミーを消してから取り込む
 * - reject: 同意がないので取り込まない（確認を求める）
 */
export type DummyHandling = "none" | "delete" | "reject";

export function decideDummyHandling(
  hasDummy: boolean,
  confirmedDelete: boolean
): DummyHandling {
  if (!hasDummy) return "none";
  return confirmedDelete ? "delete" : "reject";
}

/** ダミーが残っている議会に、削除の同意なしで実データを入れようとした */
export class DummyDataExistsError extends Error {
  constructor() {
    super(
      "この議会には表示確認用のダミーデータがあります。ダミーを削除してから取り込んでください"
    );
    this.name = "DummyDataExistsError";
  }
}
