import { Home, User } from "lucide-react";
import type { ReactNode } from "react";
import { loadAssemblyKindBySlug } from "@/features/assemblies/server/loaders/load-assembly-kind-by-slug";
import { LogoutButton } from "@/features/auth/client/components/logout-button";
import { requireUserPage } from "@/features/auth/server/lib/session";
import { NavigationLinks } from "./layout/navigation-links";

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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  みらい議会＠全国地方議会 管理画面
                </h1>
              </div>
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
          <NavigationLinks kindBySlug={kindBySlug} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
