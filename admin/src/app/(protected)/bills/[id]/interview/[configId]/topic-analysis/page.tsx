import { requireSuperAdminPage } from "@/features/auth/server/lib/auth-server";
import { TopicAnalysisPageContent } from "@/features/topic-analysis/server/components/topic-analysis-page";

interface TopicAnalysisPageProps {
  params: Promise<{ id: string; configId: string }>;
}

export default async function TopicAnalysisPage({
  params,
}: TopicAnalysisPageProps) {
  // インタビュー・分析は全体管理者だけ（議会の担当者にはまだ開放していない）
  await requireSuperAdminPage();
  const { id, configId } = await params;
  return <TopicAnalysisPageContent billId={id} configId={configId} />;
}
