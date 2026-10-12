import type { QuestionAnswerCount } from "../types";

/** DB function get_question_answer_counts の1行 */
type RawQuestionAnswerCount = {
  question_id: string;
  question: string;
  question_order: number;
  asked_session_count: number;
  answered_session_count: number;
};

export function mapQuestionAnswerCounts(
  rows: RawQuestionAnswerCount[]
): QuestionAnswerCount[] {
  return rows.map((row) => ({
    questionId: row.question_id,
    question: row.question,
    questionOrder: row.question_order,
    askedSessionCount: row.asked_session_count,
    answeredSessionCount: row.answered_session_count,
  }));
}
