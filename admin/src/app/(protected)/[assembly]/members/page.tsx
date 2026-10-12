import { AssemblyMembers } from "@/features/assemblies/client/components/assembly-members";
import { loadAssemblyMembers } from "@/features/assemblies/server/loaders/load-assembly-members";
import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";

export default async function AssemblyMembersPage({
  params,
}: {
  params: Promise<{ assembly: string }>;
}) {
  const { assembly } = await requireAssemblyPage(
    (await params).assembly,
    "super_admin"
  );
  const members = await loadAssemblyMembers(assembly.id);

  return (
    <AssemblyMembers
      assemblySlug={assembly.slug}
      assemblyName={assembly.name}
      members={members}
    />
  );
}
