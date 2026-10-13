import "server-only";

import { isReportAnalyzable } from "@mirai-gikai/shared/topic-analysis/analyzable";
import { runAnalyzeBill } from "@mirai-gikai/topic-analysis-core/analyze";
import { after } from "next/server";
import { findInterviewSessionWithConfigById } from "../repositories/interview-session-repository";

/**
 * インタビューの回答が公開されたら、その議案のトピック分析（差分）を動かす（運用方針: 完了ごと）。
 * 応答を返したあとに同じ関数の中で動かし（after）、失敗してもインタビューの完了や公開設定の変更は止めない。
 * 同じ議案の分析が実行中なら飛ばす（その回答は次の分析で入る）。
 * 時間は呼び出し元のページ・Route Handler の maxDuration まで使える。
 */
export function requestTopicAnalysisIfAnalyzable(
  sessionId: string,
  report: { is_public_by_user: boolean; is_public_by_admin: boolean }
): void {
  if (!isReportAnalyzable(report)) return;

  after(async () => {
    try {
      const session = await findInterviewSessionWithConfigById(sessionId);
      const result = await runAnalyzeBill(
        session.interview_configs.bill_id,
        "incremental"
      );
      console.log(
        `[topic-analysis] after interview ${sessionId}: ${JSON.stringify(result)}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        `Topic analysis failed after interview ${sessionId}: ${message}`
      );
    }
  });
}
