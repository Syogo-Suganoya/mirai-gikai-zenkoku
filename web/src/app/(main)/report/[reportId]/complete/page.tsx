import { ReportCompletePage } from "@/features/interview-report/server/components/report-complete-page";

interface InterviewReportPageProps {
  params: Promise<{
    reportId: string;
  }>;
}

// この画面から公開に切り替えると、応答のあとにトピック分析（差分）を動かす（Server Action の after）
// Vercel の関数の上限（Hobby は 300 秒）まで使う
export const maxDuration = 300;

export default async function InterviewReportPage({
  params,
}: InterviewReportPageProps) {
  const { reportId } = await params;

  return <ReportCompletePage reportId={reportId} />;
}
