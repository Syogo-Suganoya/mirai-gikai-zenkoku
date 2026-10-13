import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { isAiBusyError } from "./is-ai-busy-error";

function apiCallError(statusCode: number) {
  return new APICallError({
    message: `status ${statusCode}`,
    url: "https://example.com",
    requestBodyValues: {},
    statusCode,
  });
}

describe("isAiBusyError", () => {
  it("503・429 は混雑とみなす", () => {
    expect(isAiBusyError(apiCallError(503))).toBe(true);
    expect(isAiBusyError(apiCallError(429))).toBe(true);
  });

  it("やり直しのあとの RetryError は最後のエラーで判定する", () => {
    const error = new RetryError({
      message: "failed after 3 attempts",
      reason: "maxRetriesExceeded",
      errors: [apiCallError(503), apiCallError(503)],
    });
    expect(isAiBusyError(error)).toBe(true);
  });

  it("それ以外のエラーは混雑とみなさない", () => {
    expect(isAiBusyError(apiCallError(400))).toBe(false);
    expect(isAiBusyError(apiCallError(500))).toBe(false);
    expect(isAiBusyError(new Error("boom"))).toBe(false);
    expect(isAiBusyError(undefined)).toBe(false);
  });
});
