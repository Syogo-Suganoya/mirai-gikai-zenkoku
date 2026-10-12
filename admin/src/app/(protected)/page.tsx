import { Upload } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AssemblyMap } from "@/features/assemblies/client/components/assembly-map";
import { AssemblyList } from "@/features/assemblies/server/components/assembly-list";
import { loadAssemblies } from "@/features/assemblies/server/loaders/load-assemblies";
import { requireUserPage } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";

export default async function AssembliesPage() {
  const user = await requireUserPage();
  const assemblies = await loadAssemblies(user);

  // 担当の議会が1つだけなら、最初からその議会を開く（設計 v3 6.3節）
  if (!user.is_super_admin && assemblies.length === 1) {
    redirect(routes.assemblyBills(assemblies[0].slug) as Route);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">議会一覧</h1>
          <p className="mt-1 text-gray-600">
            {user.is_super_admin
              ? "すべての議会です。議会を選ぶと議案・会期を管理できます"
              : "担当している議会です"}
          </p>
        </div>
        {user.is_super_admin && (
          <Button variant="outline" asChild>
            <Link href={routes.assemblyMasterImport() as Route}>
              <Upload className="mr-1 h-4 w-4" />
              議会マスタを CSV で取り込む
            </Link>
          </Button>
        )}
      </div>
      {assemblies.length === 0 ? (
        <p className="text-gray-500">
          担当している議会がありません。全体管理者に担当の設定を依頼してください
        </p>
      ) : (
        <div className="space-y-6">
          {/* 都道府県議会は地図からも開ける（細かい県は下の一覧から） */}
          {assemblies.some((a) => a.type === "prefecture") && (
            <AssemblyMap
              assemblies={assemblies}
              showOutOfScopeLegend={!user.is_super_admin}
            />
          )}
          <AssemblyList assemblies={assemblies} />
        </div>
      )}
    </div>
  );
}
