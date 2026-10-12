import { AssemblySettingsForm } from "@/features/assemblies/client/components/assembly-settings-form";
import { DummyDataSection } from "@/features/assemblies/client/components/dummy-data-section";
import { loadAssemblySettingsData } from "@/features/assemblies/server/loaders/load-assembly-settings-data";
import { loadDummyDataCounts } from "@/features/assemblies/server/loaders/load-dummy-data-counts";
import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";

export default async function AssemblySettingsPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, settings, role } = await requireAssemblyPage(
    (await params).assembly,
    "reviewer"
  );
  // ダミーの削除は全体管理者だけ（設計 v3 8.5.4節）
  const isSuperAdmin = role === "super_admin";
  const [counts, dummyCounts] = await Promise.all([
    loadAssemblySettingsData(assembly.id),
    isSuperAdmin ? loadDummyDataCounts(assembly.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <AssemblySettingsForm
        assemblySlug={assembly.slug}
        settings={settings}
        hasMiraiMember={assembly.has_mirai_member}
        counts={counts}
      />
      {dummyCounts && (
        <DummyDataSection
          assemblySlug={assembly.slug}
          assemblyName={assembly.name}
          counts={dummyCounts}
        />
      )}
    </div>
  );
}
