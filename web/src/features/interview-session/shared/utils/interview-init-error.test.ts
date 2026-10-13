import { describe, expect, it } from "vitest";
import {
  InitialQuestionGenerationError,
  interviewInitErrorView,
} from "./interview-init-error";

describe("interviewInitErrorView", () => {
  it("最初の質問を作れなかったときは、やり直せる表示にする", () => {
    const view = interviewInitErrorView(new InitialQuestionGenerationError());
    expect(view.retryable).toBe(true);
    expect(view.title).toBe("最初の質問を用意できませんでした");
  });

  it("それ以外のエラーは既定の表示（やり直しボタンなし）", () => {
    expect(interviewInitErrorView(new Error("db down"))).toEqual({
      retryable: false,
    });
  });
});
