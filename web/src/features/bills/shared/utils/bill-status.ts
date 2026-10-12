import type { BillResultEnum, BillStatusEnum } from "../types";

/** 可決・採択など、議案が通った結果か */
export function isPassedResult(result: BillResultEnum): boolean {
  return result === "passed" || result === "amended" || result === "adopted";
}

/** カード用の簡略化されたステータスラベルを取得 */
export function getCardStatusLabel(
  status: BillStatusEnum,
  result?: BillResultEnum | null
): string {
  switch (status) {
    case "introduced":
    case "referred_to_committee":
      return "審議中";
    case "decided":
      if (!result) return "議決済み";
      if (result === "amended") return "修正可決";
      if (result === "adopted") return "採択";
      if (result === "not_adopted") return "不採択";
      return isPassedResult(result) ? "可決" : "否決";
    case "continued":
      return "継続審査";
    case "withdrawn":
      return "撤回";
    default:
      return "提出前";
  }
}

/** ステータスに対応するBadgeのvariantを取得 */
export function getStatusVariant(
  status: BillStatusEnum,
  result?: BillResultEnum | null
): "light" | "default" | "dark" | "muted" {
  switch (status) {
    case "introduced":
    case "referred_to_committee":
    case "continued":
      return "light";
    case "decided":
      return !result || isPassedResult(result) ? "default" : "dark";
    case "withdrawn":
      return "dark";
    default:
      return "muted";
  }
}
