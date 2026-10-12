import type { AssemblyListItem } from "../types";

/**
 * 管理画面の地図での都道府県の塗り分け。
 * - real: 実データの議案がある
 * - dummy: 議案はダミーだけ
 * - empty: 議会はあるが議案がない
 * - none: 議会が登録されていない（押せない）
 */
export type AssemblyMapState = "real" | "dummy" | "empty" | "none";

export function toAssemblyMapState(
  assembly: Pick<AssemblyListItem, "billCount" | "dummyBillCount"> | undefined
): AssemblyMapState {
  if (!assembly) return "none";
  if (assembly.billCount === 0) return "empty";
  return assembly.billCount > assembly.dummyBillCount ? "real" : "dummy";
}

/** 地図のツールチップ（「愛知県議会 議案226件（公開中226件）」） */
export function assemblyMapLabel(
  assembly: Pick<
    AssemblyListItem,
    "name" | "billCount" | "publishedBillCount" | "dummyBillCount"
  >
): string {
  if (assembly.billCount === 0) return `${assembly.name} 議案なし`;
  const dummy = assembly.dummyBillCount > 0 ? "・ダミー" : "";
  return `${assembly.name} 議案${assembly.billCount}件（公開中${assembly.publishedBillCount}件${dummy}）`;
}
