import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { chatStreamErrorMessage } from "./chat-stream-error-message";

describe("chatStreamErrorMessage", () => {
  it("AI が混み合っているときはその旨を返す", () => {
    const error = new APICallError({
      message: "The model is overloaded.",
      url: "https://example.com",
      requestBodyValues: {},
      statusCode: 503,
    });
    expect(chatStreamErrorMessage(error)).toBe(
      "AI が混み合っています。しばらく待ってから再度お試しください。"
    );
  });

  it("それ以外は中身を見せずに汎用の文言を返す", () => {
    expect(chatStreamErrorMessage(new Error("secret detail"))).toBe(
      "エラーが発生しました。しばらく待ってから再度お試しください。"
    );
  });
});
