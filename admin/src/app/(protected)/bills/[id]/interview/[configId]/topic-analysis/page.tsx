import { requireUserPage } from "@/features/auth/server/lib/session";
import { TopicAnalysisPageContent } from "@/features/topic-analysis/server/components/topic-analysis-page";

interface TopicAnalysisPageProps {
  params: Promise<{ id: string; configId: string }>;
}

export default async function TopicAnalysisPage({
  params,
}: TopicAnalysisPageProps) {
  await requireUserPage();
  const { id, configId } = await params;
  return <TopicAnalysisPageContent billId={id} configId={configId} />;
}
