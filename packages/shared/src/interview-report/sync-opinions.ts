import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, eq, gte, sql } from "@mirai-gikai/db/orm";
import { interview_opinion } from "@mirai-gikai/db/schema";
import type { InterviewOpinionInsert } from "./build-opinion-rows";

/**
 * レポートの意見を interview_opinion（正規化プロジェクション）へ同期する。
 *
 * opinion_id(UUID) を安定させるため delete+insert ではなく
 * ON CONFLICT (interview_report_id, opinion_index) DO UPDATE で upsert する（§3.1）。
 * 意見数が減った再生成では、新配列長以降の opinion_index を持つ行のみ削除する。
 *
 * web のインタビュー完了時 dual-write と admin の再抽出バックフィルで共通利用する。
 */
export async function syncInterviewOpinions(
  reportId: string,
  rows: InterviewOpinionInsert[]
): Promise<void> {
  const db = createDb();

  if (rows.length > 0) {
    await db
      .insert(interview_opinion)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          interview_opinion.interview_report_id,
          interview_opinion.opinion_index,
        ],
        set: {
          title: sql`excluded.title`,
          content: sql`excluded.content`,
          source_message_id: sql`excluded.source_message_id`,
          contextual_quote: sql`excluded.contextual_quote`,
          bill_sentiment: sql`excluded.bill_sentiment`,
          richness: sql`excluded.richness`,
          concern: sql`excluded.concern`,
          proposal: sql`excluded.proposal`,
          reasoning_types: sql`excluded.reasoning_types`,
          tags_extracted_at: sql`excluded.tags_extracted_at`,
        },
      });
  }

  // 意見数が縮んだ（または0になった）場合に末尾の古い行を削除
  await db
    .delete(interview_opinion)
    .where(
      and(
        eq(interview_opinion.interview_report_id, reportId),
        gte(interview_opinion.opinion_index, rows.length)
      )
    );
}
