"use client";

import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** 議会の画面の見出しと、議会の中のタブ（議案・会期） */
export function AssemblyHeader({ slug, name }: { slug: string; name: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: routes.assemblyBills(slug), label: "議案" },
    { href: routes.assemblySessions(slug), label: "会期" },
  ];

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
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
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
