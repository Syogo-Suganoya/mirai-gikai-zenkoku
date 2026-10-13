import {
  ASSEMBLY_KIND_LABELS,
  type AssemblyKind,
} from "@mirai-gikai/shared/assemblies/assembly-kind";
import { routes } from "@/lib/routes";

/** スラッグ → 区分（ヘッダーで、議会のページでも区分を示すのに使う） */
export type AssemblyKindBySlug = Readonly<Record<string, AssemblyKind>>;

export const ASSEMBLY_KIND_LINKS: ReadonlyArray<{
  kind: AssemblyKind;
  label: string;
  href: string;
}> = [
  {
    kind: "prefecture",
    label: ASSEMBLY_KIND_LABELS.prefecture,
    href: routes.home(),
  },
  {
    kind: "city",
    label: ASSEMBLY_KIND_LABELS.city,
    href: routes.cityAssemblies(),
  },
  {
    kind: "town",
    label: ASSEMBLY_KIND_LABELS.town,
    href: routes.townAssemblies(),
  },
];

/**
 * いま開いているページの区分。
 * 区分の一覧ページならその区分、議会のページ（/[assembly]/...）ならその議会の区分。
 * どちらでもなければ null。
 */
export function activeAssemblyKind(
  pathname: string,
  kindBySlug: AssemblyKindBySlug = {}
): AssemblyKind | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const listKind = ASSEMBLY_KIND_LINKS.find((link) => link.href === path);
  if (listKind) return listKind.kind;

  const slug = decodeURIComponent(path.split("/")[1] ?? "");
  return Object.hasOwn(kindBySlug, slug) ? kindBySlug[slug] : null;
}
