import { SITE_NAME } from "@mirai-gikai/shared/site/site-name";
import { User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { loadAssemblyKindBySlug } from "@/features/assemblies/server/loaders/load-assembly-kind-by-slug";
import { LogoutButton } from "@/features/auth/client/components/logout-button";
import { requireUserPage } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";
import { AssemblyKindNav, NavigationLinks } from "./layout/navigation-links";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUserPage();
  const kindBySlug = await loadAssemblyKindBySlug();
  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href={routes.home()}
                className="flex items-center"
                aria-label={`${SITE_NAME}（非公式） 管理画面 ホーム`}
              >
                <SiteLogo />
              </Link>
              {/* 狭い画面では下のメニューの行に出す */}
              <AssemblyKindNav
                className="ml-4 hidden sm:flex"
                kindBySlug={kindBySlug}
              />
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{user.email}</span>
              </div>
              <LogoutButton />
            </div>
          </div>

          {/* Navigation */}
          <AssemblyKindNav className="pb-2 sm:hidden" kindBySlug={kindBySlug} />
          <NavigationLinks />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
