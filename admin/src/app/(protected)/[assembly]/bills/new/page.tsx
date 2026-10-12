import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { BillCreateForm } from "@/features/bills-edit/client/components/bill-create-form";
import { loadSessions } from "@/features/sessions/server/loaders/load-sessions";

export default async function BillCreatePage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, settings } = await requireAssemblyPage(
    (await params).assembly
  );
  // ダミーの会期は選べない（登録するとダミーを消すため）
  const sessions = await loadSessions(assembly.id, { excludeDummy: true });

  return (
    <BillCreateForm
      assemblySlug={assembly.slug}
      assemblyName={assembly.name}
      sessions={sessions}
      defaultPublishLevel={settings.default_publish_level}
    />
  );
}
