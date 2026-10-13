"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ASSEMBLY_KIND_LINKS,
  type AssemblyKindBySlug,
  activeAssemblyKind,
} from "../../shared/utils/assembly-kind-links";

/**
 * 議会の区分（都道府県・市・区町村）の切り替え。ヘッダーとメニューに出す。
 * 議会のページでも、その議会の区分を選択中として示す。
 */
export function AssemblyKindNav({
  className,
  kindBySlug,
}: {
  className?: string;
  kindBySlug?: AssemblyKindBySlug;
}) {
  const pathname = usePathname();
  const active = activeAssemblyKind(pathname, kindBySlug);
  const isListPage = (href: string) =>
    (pathname.replace(/\/+$/, "") || "/") === href;
  return (
    <nav aria-label="議会の区分" className={cn("flex gap-1", className)}>
      {ASSEMBLY_KIND_LINKS.map((link) => (
        <Link
          key={link.kind}
          href={link.href as Route}
          aria-current={
            active === link.kind
              ? isListPage(link.href)
                ? "page"
                : "true"
              : undefined
          }
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold text-mirai-text-secondary transition-colors hover:bg-mirai-surface-muted hover:text-mirai-text",
            active === link.kind && "bg-mirai-surface-muted text-mirai-text"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
