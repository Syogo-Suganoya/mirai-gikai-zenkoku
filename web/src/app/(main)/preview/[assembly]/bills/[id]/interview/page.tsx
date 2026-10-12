import { notFound } from "next/navigation";
import { PreviewBanner } from "@/features/bills/server/components/preview-banner";
import { requirePreviewBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { InterviewLPPage } from "@/features/interview-config/client/components/interview-lp-page";
import { getInterviewConfigAdmin } from "@/features/interview-config/server/loaders/get-interview-config-admin";
import { getUserReportsByInterviewConfig } from "@/features/interview-report/server/loaders/get-user-reports-by-interview-config";
import { getLatestInterviewSession } from "@/features/interview-session/server/loaders/get-latest-interview-session";

export const dynamic = "force-dynamic";

interface InterviewPreviewPageProps {
  params: Promise<{ assembly: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function InterviewPreviewPage({
  params,
  searchParams,
}: InterviewPreviewPageProps) {
  const [{ assembly: assemblySlug, id }, { token }] = await Promise.all([
    params,
    searchParams,
  ]);

  // 管理者用の取得（非公開議案・非公開設定も対象）。トークンが正しくなければ 404
  const { assembly, bill } = await requirePreviewBill(assemblySlug, id, token);
  const interviewConfig = await getInterviewConfigAdmin(bill.id);
  if (!interviewConfig) {
    notFound();
  }

  // 最新のセッション情報とユーザーの過去レポートを取得
  const [latestSession, userReports] = await Promise.all([
    getLatestInterviewSession(interviewConfig.id),
    getUserReportsByInterviewConfig(interviewConfig.id),
  ]);

  return (
    <>
      <PreviewBanner
        assemblySlug={assembly.slug}
        message="このインタビューは一般公開されていません"
      />
      <InterviewLPPage
        bill={bill}
        interviewConfig={interviewConfig}
        sessionInfo={latestSession}
        previewToken={token}
        userReports={userReports}
      />
    </>
  );
}
