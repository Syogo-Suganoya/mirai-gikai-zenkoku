import "server-only";

import { createDb } from "@mirai-gikai/db";
import { asc, eq } from "@mirai-gikai/db/orm";
import { topic } from "@mirai-gikai/db/schema";

/** 生のトピック行（フィルタ・整形前）。 */
export type RawAnalysisTopicRow = {
  id: string;
  title: string;
  description: string;
  parent_topic_id: string | null;
  topic_opinion: Array<{
    interview_opinion: {
      id: string;
      opinion_index: number;
      title: string;
      content: string;
      contextual_quote: string | null;
      bill_sentiment: string | null;
      richness: number | null;
      concern: string | null;
      proposal: string | null;
      reasoning_types: string[];
      interview_report: {
        role: string | null;
        role_title: string | null;
        is_public_by_admin: boolean;
        is_public_by_user: boolean;
        moderation_status: string | null;
      };
    } | null;
  }> | null;
};

/**
 * 指定 version のトピックと意見を、表示判定に必要な列込みで取得する。
 *
 * `is_public_by_admin` / `is_public_by_user` / `moderation_status` を必ず取る。
 * `topic_opinion` の割当は分析実行時点のスナップショットなので、その後に
 * 管理者が非公開化・ユーザーが同意撤回・モデレーションが ng になった意見も
 * 割当行としては残る。表示のたびに再判定しないと、撤回済みの発言が
 * 引用の導線に出続ける。
 *
 * 意見の並びは `opinion_index` で固定する。ネスト埋め込みは order を
 * 指定しないと順序が保証されず、同点ソートの安定性が崩れる。
 */
export async function findAnalysisTopics(
  versionId: string
): Promise<RawAnalysisTopicRow[]> {
  const rows = await createDb().query.topic.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      parent_topic_id: true,
    },
    where: eq(topic.version_id, versionId),
    orderBy: asc(topic.sort_order),
    with: {
      topic_opinion: {
        columns: {},
        with: {
          interview_opinion: {
            columns: {
              id: true,
              opinion_index: true,
              title: true,
              content: true,
              contextual_quote: true,
              bill_sentiment: true,
              richness: true,
              concern: true,
              proposal: true,
              reasoning_types: true,
            },
            with: {
              interview_report: {
                columns: {
                  role: true,
                  role_title: true,
                  is_public_by_admin: true,
                  is_public_by_user: true,
                  moderation_status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // ネストした意見は opinion_index 順に並べ直す（関連の取得は順序が保証されない）
  return rows.map((row) => ({
    ...row,
    topic_opinion: [...row.topic_opinion].sort(
      (a, b) =>
        (a.interview_opinion?.opinion_index ?? 0) -
        (b.interview_opinion?.opinion_index ?? 0)
    ),
  })) as RawAnalysisTopicRow[];
}
