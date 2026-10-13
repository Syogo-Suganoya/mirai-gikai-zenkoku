/**
 * 最初の質問を作れなかった（AI が混み合っている・利用上限など）。
 * 会話の無いセッションは残るので、ページを開き直せば作り直す。
 */
export class InitialQuestionGenerationError extends Error {
  constructor() {
    super("Failed to generate the initial interview question");
    this.name = "InitialQuestionGenerationError";
  }
}

type InterviewInitErrorView = {
  title?: string;
  message?: string;
  retryable: boolean;
};

/** インタビューを開けなかったときの表示（InterviewSessionErrorView に渡す） */
export function interviewInitErrorView(error: unknown): InterviewInitErrorView {
  if (error instanceof InitialQuestionGenerationError) {
    return {
      title: "最初の質問を用意できませんでした",
      message:
        "AI が混み合っている可能性があります。少し待ってから「もう一度試す」を押してください。",
      retryable: true,
    };
  }
  // それ以外は既定の文言（トップに戻ってやり直す）
  return { retryable: false };
}
