import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAssemblyBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { InterviewDisclosurePage } from "@/features/interview-config/server/components/interview-disclosure-page";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { loadDisclosureData } from "@/features/interview-config/server/loaders/load-disclosure-data";
import { requireInterviewBill } from "@/features/interview-config/server/loaders/require-interview-bill";

interface DisclosurePageProps {
  params: Promise<{ assembly: string; id: string }>;
}

export async function generateMetadata({
  params,
}: DisclosurePageProps): Promise<Metadata> {
  const { assembly, id } = await params;
  const result = await getAssemblyBill(assembly, id);
  if (!result) {
    return { title: "議案が見つかりません" };
  }

  const billName = result.bill.bill_content?.title ?? result.bill.name;
  return {
    title: `AIインタビューに関する情報開示 - ${billName}`,
    description: `${billName}のAIインタビューにおける透明性および技術仕様に関する開示事項`,
  };
}

export default async function DisclosurePage({ params }: DisclosurePageProps) {
  const { assembly, id } = await params;
  const { bill } = await requireInterviewBill(assembly, id);
  const interviewConfig = await getInterviewConfig(bill.id);
  if (!interviewConfig) {
    notFound();
  }

  const disclosureData = await loadDisclosureData(bill, interviewConfig);
  return <InterviewDisclosurePage {...disclosureData} />;
}
