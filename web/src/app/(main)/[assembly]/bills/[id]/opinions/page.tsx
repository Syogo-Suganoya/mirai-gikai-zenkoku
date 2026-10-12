import type { Metadata } from "next";
import { getAssemblyBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { BillOpinionsPage } from "@/features/user-topic-analysis/server/components/bill-opinions-page";

interface OpinionsPageProps {
  params: Promise<{ assembly: string; id: string }>;
}

export async function generateMetadata({
  params,
}: OpinionsPageProps): Promise<Metadata> {
  const { assembly, id } = await params;
  const result = await getAssemblyBill(assembly, id);
  const title = result?.bill.bill_content?.title || result?.bill.name || "議案";

  return {
    title: `AIインタビューの回答一覧 - ${title}`,
    description: `${title}に寄せられたAIインタビューの回答一覧`,
  };
}

export default async function OpinionsPage({ params }: OpinionsPageProps) {
  const { assembly, id } = await params;
  return <BillOpinionsPage assemblySlug={assembly} billKey={id} />;
}
