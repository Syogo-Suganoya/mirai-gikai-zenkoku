import type { AssemblySummary } from "../types";

/**
 * 地図での都道府県の塗り分け。
 * - in_session: いま開会中（議案が実データかダミーかによらず優先する）
 * - real: 都道府県議会に実データの議案がある
 * - dummy: 議案はダミーだけ
 * - none: 公開中の議案がない（押せない）
 */
export type PrefectureMapState = "in_session" | "real" | "dummy" | "none";

/** 都道府県議会から、地図での塗り分けを決める */
export function toPrefectureMapState(
  assembly: Pick<AssemblySummary, "dummyOnly" | "activeSessionName"> | undefined
): PrefectureMapState {
  if (!assembly) return "none";
  if (assembly.activeSessionName !== null) return "in_session";
  return assembly.dummyOnly ? "dummy" : "real";
}
