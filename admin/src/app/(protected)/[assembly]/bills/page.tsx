import { requireAssemblyPage } from "@/features/assemblies/server/loaders/require-assembly";
import { hasAssemblyRole } from "@/features/assemblies/shared/utils/assembly-role";
import { BillList } from "@/features/bills/server/components/bill-list/bill-list";
import { parseBillListFilter } from "@/features/bills/shared/utils/bill-list-filter";
import { parseBillSortParams } from "@/features/bills/shared/utils/parse-bill-sort-params";

interface AssemblyBillsPageProps {
  params: Promise<{ assembly: string }>;
  searchParams: Promise<{
    sort?: string;
    order?: string;
    session?: string;
    publish?: string;
    level?: string;
    data?: string;
  }>;
}

export default async function AssemblyBillsPage({
  params,
  searchParams,
}: AssemblyBillsPageProps) {
  const [{ assembly: slug }, query] = await Promise.all([params, searchParams]);
  const { assembly, role } = await requireAssemblyPage(slug);

  return (
    <BillList
      assemblySlug={assembly.slug}
      assemblyId={assembly.id}
      sortConfig={parseBillSortParams(query.sort, query.order)}
      filter={parseBillListFilter(query)}
      canReview={hasAssemblyRole(role, "reviewer")}
      isSuperAdmin={role === "super_admin"}
    />
  );
}
