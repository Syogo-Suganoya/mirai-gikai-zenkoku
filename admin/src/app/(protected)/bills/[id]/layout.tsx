import type { ReactNode } from "react";
import { AssemblyHeader } from "@/features/assemblies/client/components/assembly-header";
import { requireBillPage } from "@/features/bills/server/loaders/require-bill-access";

/** 議案の画面は、議案の議会を担当している人だけが開ける。上に議会の見出しとタブを出す */
export default async function BillLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { assembly, role } = await requireBillPage((await params).id);
  return (
    <div className="space-y-6">
      <AssemblyHeader
        slug={assembly.slug}
        name={assembly.name}
        role={role}
        activeTab="bills"
      />
      <div>{children}</div>
    </div>
  );
}
