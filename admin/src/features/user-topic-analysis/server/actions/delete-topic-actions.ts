"use server";

import { deleteTopic } from "@mirai-gikai/topic-analysis-core/repository";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";

/** Admin による個別トピック削除（LLM の誤割当トピックを取り除く手動操作）。 */
export async function deleteTopicAction(input: {
  topicId: string;
  versionId: string;
  billId: string;
}): Promise<void> {
  await requireUser();
  await deleteTopic(input.topicId, input.versionId);
  revalidatePath(routes.billUserTopicAnalysis(input.billId));
}
