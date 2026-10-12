import type { AssemblySummary } from "../types";

/**
 * 議会選択画面の並び順。実データのある議会を先に、ダミーだけの議会を後に並べる（8.5.3節）。
 * 同じ区分の中では都道府県コード順、都道府県議会を市区町村議会より先にする。
 */
export function sortAssembliesForSelect(
  items: readonly AssemblySummary[]
): AssemblySummary[] {
  const typeOrder = (type: AssemblySummary["type"]) =>
    type === "prefecture" ? 0 : 1;
  return [...items].sort(
    (a, b) =>
      Number(a.dummyOnly) - Number(b.dummyOnly) ||
      a.prefecture_code.localeCompare(b.prefecture_code) ||
      typeOrder(a.type) - typeOrder(b.type) ||
      a.name.localeCompare(b.name, "ja")
  );
}

/**
 * 都道府県コード → 都道府県議会。議会選択画面（地図・地方ボタン）は都道府県議会だけを扱う。
 * 市区町村議会は含めない。
 */
export function prefectureAssemblyByCode(
  items: readonly AssemblySummary[]
): Record<string, AssemblySummary> {
  return Object.fromEntries(
    items
      .filter((item) => item.type === "prefecture")
      .map((item) => [item.prefecture_code, item])
  );
}
