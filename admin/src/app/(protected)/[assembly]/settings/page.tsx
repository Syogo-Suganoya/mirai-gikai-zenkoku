import { AssemblySettingsForm } from "@/features/assemblies/client/components/assembly-settings-form";
import { DummyDataSection } from "@/features/assemblies/client/components/dummy-data-section";
import { loadAssemblySettingsData } from "@/features/assemblies/server/loaders/load-assembly-settings-data";
import { loadDummyDataCounts } from "@/features/assemblies/server/loaders/load-dummy-data-counts";
import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { hasDummyCounts } from "@/features/assemblies/shared/utils/dummy-data-counts";

export default async function AssemblySettingsPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, settings } = await requireAssemblyPage(
    (await params).assembly
  );
  const [counts, dummyCounts] = await Promise.all([
    loadAssemblySettingsData(assembly.id),
    loadDummyDataCounts(assembly.id),
  ]);

  return (
    <div className="space-y-6">
      <AssemblySettingsForm
        assemblySlug={assembly.slug}
        settings={settings}
        hasMiraiMember={assembly.has_mirai_member}
        hasDummyData={hasDummyCounts(dummyCounts)}
        counts={counts}
      />
      <DummyDataSection
        assemblySlug={assembly.slug}
        assemblyName={assembly.name}
        counts={dummyCounts}
      />
    </div>
  );
}
