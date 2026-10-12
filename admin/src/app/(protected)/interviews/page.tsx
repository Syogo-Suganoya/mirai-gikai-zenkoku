import { requireUserPage } from "@/features/auth/server/lib/session";
import { AllInterviewConfigList } from "@/features/interviews/server/components/all-interview-config-list";
import {
  getAllInterviewConfigs,
  getSessionCountsForConfigs,
} from "@/features/interviews/server/loaders/get-all-interview-configs";

export default async function InterviewsPage() {
  await requireUserPage();

  const configs = await getAllInterviewConfigs();
  const sessionCounts = await getSessionCountsForConfigs(
    configs.map((config) => config.id)
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">インタビュー管理</h1>

      <section className="rounded-lg border bg-white p-6">
        <AllInterviewConfigList
          configs={configs}
          sessionCounts={sessionCounts}
        />
      </section>
    </div>
  );
}
