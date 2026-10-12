import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAssemblyBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { billKey } from "@/features/bills/shared/types";
import { resolveBillShareImageUrl } from "@/features/bills/shared/utils/bill-share-image";
import { InterviewLPPage } from "@/features/interview-config/client/components/interview-lp-page";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { requireInterviewBill } from "@/features/interview-config/server/loaders/require-interview-bill";
import { getUserReportsByInterviewConfig } from "@/features/interview-report/server/loaders/get-user-reports-by-interview-config";
import { getLatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface InterviewPageProps {
  params: Promise<{ assembly: string; id: string }>;
}

export async function generateMetadata({
  params,
}: InterviewPageProps): Promise<Metadata> {
  const { assembly, id } = await params;
  const result = await getAssemblyBill(assembly, id);
  if (!result) {
    return { title: "議案が見つかりません" };
  }

  const { bill } = result;
  const billName = bill.bill_content?.title ?? bill.name;
  const title = `AIインタビュー - ${billName}`;
  const description = `議案についてのAIインタビュー - ${billName}`;
  const shareImageUrl = resolveBillShareImageUrl(bill, env.webUrl);

  return {
    title,
    description,
    alternates: {
      canonical: routes.interviewLP(bill.assembly_slug, billKey(bill)),
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        { url: shareImageUrl, alt: `${billName} のAIインタビューページ` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImageUrl],
    },
  };
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  const { assembly, id } = await params;
  const { bill } = await requireInterviewBill(assembly, id);
  const interviewConfig = await getInterviewConfig(bill.id);
  if (!interviewConfig) {
    notFound();
  }

  // 最新のセッション情報とユーザーの過去レポートを取得
  const [latestSession, userReports] = await Promise.all([
    getLatestInterviewSession(interviewConfig.id),
    getUserReportsByInterviewConfig(interviewConfig.id),
  ]);

  return (
    <InterviewLPPage
      bill={bill}
      interviewConfig={interviewConfig}
      sessionInfo={latestSession}
      userReports={userReports}
    />
  );
}
