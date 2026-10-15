"use client";

import {
  ASSEMBLY_KIND_LABELS,
  type AssemblyKind,
} from "@mirai-gikai/shared/assemblies/assembly-kind";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type AssemblyKindBySlug,
  activeAssemblyKind,
} from "@/features/assemblies/shared/utils/active-assembly-kind";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** 議会一覧（区分ごと） */
const assemblyKindLinks: { kind: AssemblyKind; href: string }[] = [
  { kind: "prefecture", href: routes.home("prefecture") },
  { kind: "city", href: routes.home("city") },
  { kind: "town", href: routes.home("town") },
];

const navigationLinks = [
  { href: routes.tags(), label: "タグ管理" },
  { href: routes.interviews(), label: "インタビュー" },
  // 全議案トピック分析(/user-topic-analysis)は隠し機能のためヘッダーに出さない（URL直アクセスのみ）。
  // 有識者リスト(/experts)は、公開サイトで登録を止めている間（EXPERT_REGISTRATION_ENABLED）は出さない。
  { href: routes.admins(), label: "アカウント" },
];

/**
 * 議会の区分（都道府県・市・区町村）の切り替え。公開サイトのヘッダーと同じく、タイトルの横に出す。
 * 議会の画面でも、その議会の区分を選択中にする。
 */
export function AssemblyKindNav({
  className,
  kindBySlug,
}: {
  className?: string;
  kindBySlug: AssemblyKindBySlug;
}) {
  const pathname = usePathname();
  const activeKind = activeAssemblyKind(
    pathname,
    useSearchParams().get("kind"),
    kindBySlug
  );

  return (
    <nav aria-label="議会の区分" className={cn("flex gap-1", className)}>
      {assemblyKindLinks.map((link) => (
        <Link
          key={link.kind}
          href={link.href as Route}
          aria-current={activeKind === link.kind ? "true" : undefined}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-bold text-gray-600 transition-colors hover:bg-muted hover:text-gray-900",
            activeKind === link.kind && "bg-muted text-gray-900"
          )}
        >
          {ASSEMBLY_KIND_LABELS[link.kind]}
        </Link>
      ))}
    </nav>
  );
}

/** 議会の区分以外のメニュー（タグ管理・インタビュー・アカウント） */
export function NavigationLinks() {
  const pathname = usePathname();

  return (
    <nav>
      <div className="flex space-x-8">
        {navigationLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            isActive={pathname.startsWith(link.href)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href as Route}
      className={cn(
        "inline-flex items-center gap-2 px-1 py-4 text-sm border-b-2 transition-colors",
        isActive
          ? "border-blue-600 text-blue-600 font-semibold"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
      )}
    >
      <span>{label}</span>
    </Link>
  );
}
