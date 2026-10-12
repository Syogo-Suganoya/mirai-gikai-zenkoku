import { describe, expect, it } from "vitest";
import {
  estimateInterviewCostUsd,
  formatEstimatedCost,
} from "./estimate-interview-cost";

describe("estimateInterviewCostUsd", () => {
  it("Gemini 3.8 Flashの推定コストを正しく算出する", () => {
    // input: 0.75 * 85000 / 1M = 0.06375
    // output: 3.75 * 3000 / 1M = 0.01125
    // total: 0.075
    const cost = estimateInterviewCostUsd("gemini-3.8-flash");
    expect(cost).toBeCloseTo(0.075, 4);
  });

  it("Gemini 3.1 Pro Previewの推定コストを正しく算出する", () => {
    // input: 2 * 85000 / 1M = 0.17
    // output: 12 * 3000 / 1M = 0.036
    // total: 0.206
    const cost = estimateInterviewCostUsd("gemini-3.1-pro-preview");
    expect(cost).toBeCloseTo(0.206, 4);
  });

  it("不明なモデルに対してnullを返す", () => {
    expect(estimateInterviewCostUsd("openai/gpt-5")).toBeNull();
    expect(estimateInterviewCostUsd("unknown/model")).toBeNull();
  });
});

describe("formatEstimatedCost", () => {
  it("1円未満のコストを~1円と表示する", () => {
    // $0.005 * 150 = 0.75円 → ~1円
    expect(formatEstimatedCost(0.005)).toBe("~1円");
  });

  it("コストを四捨五入して円表示する", () => {
    // $0.01455 * 150 = 2.18円 → ~2円
    expect(formatEstimatedCost(0.01455)).toBe("~2円");
    // $0.225 * 150 = 33.75円 → ~34円
    expect(formatEstimatedCost(0.225)).toBe("~34円");
    // $0.5 * 150 = 75円 → ~75円
    expect(formatEstimatedCost(0.5)).toBe("~75円");
  });
});
