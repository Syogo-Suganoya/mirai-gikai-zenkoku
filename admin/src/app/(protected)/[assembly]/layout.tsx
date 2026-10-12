import type { ReactNode } from "react";
import { AssemblyHeader } from "@/features/assemblies/client/components/assembly-header";
import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";

export default async function AssemblyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ assembly: string }>;
}) {
  const { assembly, role } = await requireAssemblyPage((await params).assembly);
  return (
    <div className="space-y-6">
      <AssemblyHeader slug={assembly.slug} name={assembly.name} role={role} />
      {children}
    </div>
  );
}
