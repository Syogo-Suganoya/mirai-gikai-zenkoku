import { routes } from "@/lib/routes";

/** ヘッダーで切り替える議会の区分 */
export type AssemblyKind = "prefecture" | "city" | "town";

export const ASSEMBLY_KIND_LINKS: ReadonlyArray<{
  kind: AssemblyKind;
  label: string;
  href: string;
}> = [
  { kind: "prefecture", label: "都道府県", href: routes.home() },
  { kind: "city", label: "市", href: routes.cityAssemblies() },
  { kind: "town", label: "区町村", href: routes.townAssemblies() },
];

/** いま開いている区分の一覧ページ（議会のページなどでは null） */
export function activeAssemblyKind(pathname: string): AssemblyKind | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  return ASSEMBLY_KIND_LINKS.find((link) => link.href === path)?.kind ?? null;
}
