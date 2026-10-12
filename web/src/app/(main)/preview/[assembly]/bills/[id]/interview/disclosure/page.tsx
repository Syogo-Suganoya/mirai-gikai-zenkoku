import { notFound } from "next/navigation";
import { PreviewBanner } from "@/features/bills/server/components/preview-banner";
import { requirePreviewBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { InterviewDisclosurePage } from "@/features/interview-config/server/components/interview-disclosure-page";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { loadDisclosureData } from "@/features/interview-config/server/loaders/load-disclosure-data";

interface DisclosurePreviewPageProps {
  params: Promise<{ assembly: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function DisclosurePreviewPage({
  params,
  searchParams,
}: DisclosurePreviewPageProps) {
  const [{ assembly: assemblySlug, id }, { token }] = await Promise.all([
    params,
    searchParams,
  ]);

  const { assembly, bill } = await requirePreviewBill(assemblySlug, id, token);
  const interviewConfig = await getInterviewConfigAdmin(bill.id);
  if (!interviewConfig) {
    notFound();
  }

  const disclosureData = await loadDisclosureData(bill, interviewConfig);

  return (
    <>
      <PreviewBanner
        assemblySlug={assembly.slug}
        message="このインタビューは一般公開されていません"
      />
      <InterviewDisclosurePage {...disclosureData} previewToken={token} />
    </>
  );
}
