"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const allLinks = [
  { href: routes.home(), label: "議会", superAdminOnly: false },
  { href: routes.tags(), label: "タグ管理", superAdminOnly: true },
  { href: routes.interviews(), label: "インタビュー", superAdminOnly: true },
  // 全議案トピック分析(/user-topic-analysis)は隠し機能のためヘッダーに出さない（URL直アクセスのみ）。
  { href: routes.experts(), label: "有識者", superAdminOnly: true },
  { href: routes.admins(), label: "アカウント", superAdminOnly: true },
];

/** 確認者・編集者には、担当議会の画面（「議会」）だけを出す */
export function NavigationLinks({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const navigationLinks = allLinks.filter(
    (link) => isSuperAdmin || !link.superAdminOnly
  );

  return (
    <nav>
      <div className="flex space-x-8">
        {navigationLinks.map((link) => {
          // 「議会」は議会一覧と各議会の画面（/[assembly]/...・/bills/...）で選択中にする
          const isActive =
            link.href === routes.home()
              ? !navigationLinks.some(
                  (other) =>
                    other.href !== routes.home() &&
                    pathname.startsWith(other.href)
                )
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href as Route}
              className={cn(
                "inline-flex items-center gap-2 px-1 py-4 text-sm border-b-2 transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
              )}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
