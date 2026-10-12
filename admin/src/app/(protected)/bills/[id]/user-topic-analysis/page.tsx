import { requireSuperAdminPage } from "@/features/auth/server/lib/auth-server";
import { UserTopicAnalysisPage } from "@/features/user-topic-analysis/server/components/user-topic-analysis-page";

export default async function BillUserTopicAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdminPage();
  const { id } = await params;
  return <UserTopicAnalysisPage billId={id} />;
}
