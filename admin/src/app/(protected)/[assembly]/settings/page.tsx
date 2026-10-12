import { AssemblySettingsForm } from "@/features/assemblies/client/components/assembly-settings-form";
import { loadAssemblySettingsData } from "@/features/assemblies/server/loaders/load-assembly-settings-data";
import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";

export default async function AssemblySettingsPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, settings } = await requireAssemblyPage(
    (await params).assembly,
    "reviewer"
  );
  const counts = await loadAssemblySettingsData(assembly.id);

  return (
    <AssemblySettingsForm
      assemblySlug={assembly.slug}
      settings={settings}
      hasMiraiMember={assembly.has_mirai_member}
      counts={counts}
    />
  );
}
