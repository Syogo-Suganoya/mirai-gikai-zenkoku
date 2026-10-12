"use client";

import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { AssemblyAccessRole } from "../../shared/types";
import { hasAssemblyRole } from "../../shared/utils/assembly-role";

/**
 * 議会の画面の見出しと、議会の中のタブ（議案・会期・CSV 取り込み・議会設定・担当者）。
 * 議会設定は確認者以上、担当者は全体管理者だけに出す。
 * 議案ごとの画面（/bills/[id]/...）は URL に議会が入らないので、activeTab で「議案」を選んだ状態にする。
 */
export function AssemblyHeader({
  slug,
  name,
  role,
  activeTab,
}: {
  slug: string;
  name: string;
  role: AssemblyAccessRole;
  activeTab?: "bills";
}) {
  const pathname = usePathname();
  const tabs: {
    key: string;
    href: string;
    label: string;
    required?: AssemblyAccessRole;
  }[] = [
    { key: "bills", href: routes.assemblyBills(slug), label: "議案" },
    { key: "sessions", href: routes.assemblySessions(slug), label: "会期" },
    { key: "import", href: routes.assemblyImport(slug), label: "CSV 取り込み" },
    {
      key: "settings",
      href: routes.assemblySettings(slug),
      label: "議会設定",
      required: "reviewer",
    },
    {
      key: "members",
      href: routes.assemblyMembers(slug),
      label: "担当者",
      required: "super_admin",
    },
  ];
  const visibleTabs = tabs.filter(
    (tab) => !tab.required || hasAssemblyRole(role, tab.required)
  );

  return (
    <div className="space-y-3">
      <Link
        href={routes.home()}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" />
        議会一覧
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <nav className="flex gap-6 border-b">
        {visibleTabs.map((tab) => {
          const isActive = activeTab
            ? tab.key === activeTab
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href as Route}
              className={cn(
                "-mb-px border-b-2 px-1 pb-2 text-sm",
                isActive
                  ? "border-blue-600 font-semibold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
