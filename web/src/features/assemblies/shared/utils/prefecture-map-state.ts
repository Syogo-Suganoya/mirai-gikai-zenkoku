import type { AssemblySummary } from "../types";

/**
 * 地図での都道府県の塗り分け。
 * - real: 都道府県議会に実データの議案がある
 * - dummy: 議案はダミーだけ
 * - none: 公開中の議案がない（押せない）
 */
export type PrefectureMapState = "real" | "dummy" | "none";

/** 都道府県議会から、地図での塗り分けを決める */
export function toPrefectureMapState(
  assembly: Pick<AssemblySummary, "dummyOnly"> | undefined
): PrefectureMapState {
  if (!assembly) return "none";
  return assembly.dummyOnly ? "dummy" : "real";
}
