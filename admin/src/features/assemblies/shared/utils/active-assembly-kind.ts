import {
  type AssemblyKind,
  parseAssemblyKind,
} from "@mirai-gikai/shared/assemblies/assembly-kind";

/** スラッグ → 区分（ヘッダーで、議会の画面でも区分を示すのに使う） */
export type AssemblyKindBySlug = Readonly<Record<string, AssemblyKind>>;

/**
 * ヘッダーで選択中にする区分。
 * 議会一覧（/?kind=...）ならその区分、議会の画面（/[assembly]/...）ならその議会の区分。
 * それ以外（議案の画面・タグ管理など）は null。
 */
export function activeAssemblyKind(
  pathname: string,
  kindParam: string | null,
  kindBySlug: AssemblyKindBySlug
): AssemblyKind | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return parseAssemblyKind(kindParam ?? undefined);

  const slug = decodeURIComponent(path.split("/")[1] ?? "");
  return Object.hasOwn(kindBySlug, slug) ? kindBySlug[slug] : null;
}
