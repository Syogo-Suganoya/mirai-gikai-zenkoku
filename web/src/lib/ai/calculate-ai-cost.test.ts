import { describe, expect, it } from "vitest";

import {
  calculateUsageCostUsd,
  type SanitizedUsage,
  sanitizeUsage,
} from "./calculate-ai-cost";
import { AI_MODELS } from "./models";

describe("calculateUsageCostUsd", () => {
  it("returns 0 when usage has no tokens", () => {
    const usage: SanitizedUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };

    expect(calculateUsageCostUsd(AI_MODELS.chat, usage)).toBe(0);
  });

  it("calculates cost for known model", () => {
    const usage: SanitizedUsage = {
      inputTokens: 500,
      outputTokens: 1000,
      totalTokens: 1500,
    };

    // Gemini 3.8 Flash: 500 input tokens * $0.75/M + 1000 output tokens * $3.75/M = 0.000375 + 0.00375
    expect(calculateUsageCostUsd("gemini-3.8-flash", usage)).toBeCloseTo(
      0.004125
    );
  });

  it("calculates cost for Gemini models", () => {
    const usage: SanitizedUsage = {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      totalTokens: 2_000_000,
    };

    // Gemini 3.1 Pro Preview: $2.00 input + $12.00 output = $14.00
    expect(calculateUsageCostUsd("gemini-3.1-pro-preview", usage)).toBeCloseTo(
      14
    );
    // Gemini 3.8 Flash: $0.75 input + $3.75 output = $4.50
    expect(calculateUsageCostUsd("gemini-3.8-flash", usage)).toBeCloseTo(4.5);
    // Gemini 3.5 Flash-Lite: $0.30 input + $2.50 output = $2.80
    expect(calculateUsageCostUsd("gemini-3.5-flash-lite", usage)).toBeCloseTo(
      2.8
    );
  });

  it("throws for unknown model", () => {
    const usage: SanitizedUsage = {
      inputTokens: 1000,
      outputTokens: 1000,
      totalTokens: 2000,
    };

    expect(() => calculateUsageCostUsd("unknown-model", usage)).toThrow(
      'Unknown pricing for model "unknown-model"'
    );
  });
});

describe("sanitizeUsage", () => {
  it("uses provided input/output tokens", () => {
    const usage = sanitizeUsage({
      inputTokens: 100,
      outputTokens: 200,
      totalTokens: 0,
      inputTokenDetails: {
        noCacheTokens: undefined,
        cacheReadTokens: undefined,
        cacheWriteTokens: undefined,
      },
      outputTokenDetails: {
        textTokens: undefined,
        reasoningTokens: undefined,
      },
    });

    expect(usage).toEqual({
      inputTokens: 100,
      outputTokens: 200,
      totalTokens: 300,
    });
  });

  it("splits total tokens when input/output missing", () => {
    // biome-ignore lint/suspicious/noExplicitAny: APIレスポンスのシミュレーションのため
    const usage = sanitizeUsage({ totalTokens: 5 } as any);

    expect(usage).toEqual({ inputTokens: 2, outputTokens: 3, totalTokens: 5 });
  });
});
