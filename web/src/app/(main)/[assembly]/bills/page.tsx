import type { Metadata } from "next";
import { requireAssembly } from "@/features/assemblies/server/loaders/get-assembly";
import { BillsListPage } from "@/features/bills/server/components/bills-list-page";
import type { BillsListSearchParams } from "@/features/bills/shared/utils/parse-bills-list-params";

type Props = {
  params: Promise<{ assembly: string }>;
  searchParams: Promise<BillsListSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const assembly = await requireAssembly((await params).assembly);
  return {
    title: `議案を検索する - ${assembly.name}`,
    description: `${assembly.name}に提出された議案を、審議状況やカテゴリから探せます。`,
  };
}

export default async function BillsPage({ params, searchParams }: Props) {
  const [{ assembly: slug }, query] = await Promise.all([params, searchParams]);
  const assembly = await requireAssembly(slug);
  return <BillsListPage assembly={assembly} searchParams={query} />;
}
