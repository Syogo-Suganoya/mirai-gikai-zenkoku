import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { hasAssemblyRole } from "@/features/assemblies/shared/utils/assembly-role";
import { SessionForm } from "@/features/sessions/client/components/session-form";
import { SessionList } from "@/features/sessions/server/components/session-list";
import { loadSessions } from "@/features/sessions/server/loaders/load-sessions";

export default async function AssemblySessionsPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, role } = await requireAssemblyPage((await params).assembly);
  const sessions = await loadSessions(assembly.id);
  // 会期の追加・編集は確認者以上（年度初めに1年分を入れる。設計 v3 6.2.1節）
  const canEdit = hasAssemblyRole(role, "reviewer");

  return (
    <div className="space-y-8">
      {canEdit && (
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">会期を追加</h2>
          <SessionForm
            assemblySlug={assembly.slug}
            assemblyName={assembly.name}
          />
        </section>
      )}
      <section className="rounded-lg border bg-white p-6">
        <SessionList
          assemblySlug={assembly.slug}
          sessions={sessions}
          canEdit={canEdit}
        />
      </section>
    </div>
  );
}
