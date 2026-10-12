import { requireSuperAdminPage } from "@/features/auth/server/lib/auth-server";
import { TopicAnalysisDetailPageContent } from "@/features/topic-analysis/server/components/topic-analysis-detail-page";

interface TopicAnalysisDetailPageProps {
  params: Promise<{ id: string; configId: string; versionId: string }>;
}

export default async function TopicAnalysisDetailPage({
  params,
}: TopicAnalysisDetailPageProps) {
  // インタビュー・分析は全体管理者だけ（議会の担当者にはまだ開放していない）
  await requireSuperAdminPage();
  const { id, configId, versionId } = await params;
  return (
    <TopicAnalysisDetailPageContent
      billId={id}
      configId={configId}
      versionId={versionId}
    />
  );
}
