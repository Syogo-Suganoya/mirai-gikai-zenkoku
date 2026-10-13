/** 議会の種類（assemblies.type） */
export type AssemblyTypeValue =
  | "prefecture"
  | "city"
  | "special_ward"
  | "town"
  | "village";

/** 画面で切り替える議会の区分（公開サイトのヘッダー・管理画面の議会一覧） */
export type AssemblyKind = "prefecture" | "city" | "town";

export const ASSEMBLY_KIND_LABELS: Readonly<Record<AssemblyKind, string>> = {
  prefecture: "都道府県",
  city: "市",
  town: "区町村",
};

/** 議会の種類を区分にまとめる（特別区・町・村は「区町村」） */
export function toAssemblyKind(type: AssemblyTypeValue): AssemblyKind {
  if (type === "prefecture") return "prefecture";
  if (type === "city") return "city";
  return "town";
}

const ASSEMBLY_KINDS: readonly AssemblyKind[] = ["prefecture", "city", "town"];

/** URL の値（?kind=city など）を区分にする。知らない値・無いときは都道府県 */
export function parseAssemblyKind(value: unknown): AssemblyKind {
  return ASSEMBLY_KINDS.includes(value as AssemblyKind)
    ? (value as AssemblyKind)
    : "prefecture";
}
