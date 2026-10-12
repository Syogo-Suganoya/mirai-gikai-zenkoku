import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { SessionForm } from "@/features/sessions/client/components/session-form";
import { SessionList } from "@/features/sessions/server/components/session-list";
import { loadSessions } from "@/features/sessions/server/loaders/load-sessions";

export default async function AssemblySessionsPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly } = await requireAssemblyPage((await params).assembly);
  const sessions = await loadSessions(assembly.id);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">会期を追加</h2>
        <SessionForm
          assemblySlug={assembly.slug}
          assemblyName={assembly.name}
        />
      </section>
      <section className="rounded-lg border bg-white p-6">
        <SessionList assemblySlug={assembly.slug} sessions={sessions} />
      </section>
    </div>
  );
}
