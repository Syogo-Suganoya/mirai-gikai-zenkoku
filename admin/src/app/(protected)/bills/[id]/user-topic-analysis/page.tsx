import { requireUserPage } from "@/features/auth/server/lib/session";
import { UserTopicAnalysisPage } from "@/features/user-topic-analysis/server/components/user-topic-analysis-page";

export default async function BillUserTopicAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUserPage();
  const { id } = await params;
  return <UserTopicAnalysisPage billId={id} />;
}
