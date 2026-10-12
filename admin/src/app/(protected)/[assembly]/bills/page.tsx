import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { BillList } from "@/features/bills/server/components/bill-list/bill-list";
import { parseBillSortParams } from "@/features/bills/shared/utils/parse-bill-sort-params";

interface AssemblyBillsPageProps {
  params: Promise<{ assembly: string }>;
  searchParams: Promise<{
    sort?: string;
    order?: string;
  }>;
}

export default async function AssemblyBillsPage({
  params,
  searchParams,
}: AssemblyBillsPageProps) {
  const [{ assembly: slug }, { sort, order }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { assembly } = await requireAssemblyPage(slug);

  return (
    <BillList
      assemblySlug={assembly.slug}
      assemblyId={assembly.id}
      sortConfig={parseBillSortParams(sort, order)}
    />
  );
}
