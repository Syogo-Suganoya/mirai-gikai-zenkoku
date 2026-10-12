import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, eq } from "@mirai-gikai/db/orm";
import { interview_configs } from "@mirai-gikai/db/schema";

export async function verifyConfigBelongsToBill(
  configId: string,
  billId: string
): Promise<void> {
  const [row] = await createDb()
    .select({ id: interview_configs.id })
    .from(interview_configs)
    .where(
      and(
        eq(interview_configs.id, configId),
        eq(interview_configs.bill_id, billId)
      )
    );

  if (!row) {
    throw new Error("指定されたインタビュー設定はこの議案に属していません");
  }
}
