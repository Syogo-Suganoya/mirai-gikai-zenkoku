import { describe, expect, it } from "vitest";
import {
  calculateProgressWidth,
  getCurrentStep,
  getStatusMessage,
  getStepState,
} from "./bill-progress";

describe("getCurrentStep", () => {
  it("審議の段階をステップ番号にする", () => {
    expect(getCurrentStep("preparing")).toBe(0);
    expect(getCurrentStep("introduced")).toBe(1);
    expect(getCurrentStep("referred_to_committee")).toBe(2);
    expect(getCurrentStep("decided")).toBe(3);
    expect(getCurrentStep("continued")).toBe(2);
  });
});

describe("getStatusMessage", () => {
  it("補足があれば補足、なければ状態に応じた文言", () => {
    expect(getStatusMessage("preparing", "x")).toBe("議案提出前");
    expect(getStatusMessage("introduced", "本会議で説明")).toBe("本会議で説明");
    expect(getStatusMessage("continued", null)).toBe("継続審査になりました");
    expect(getStatusMessage("decided", null)).toBe("");
  });
});

describe("getStepState / calculateProgressWidth", () => {
  it("現在のステップまでを active にする", () => {
    expect(getStepState(1, 2, false)).toBe("active");
    expect(getStepState(3, 2, false)).toBe("inactive");
    expect(getStepState(1, 2, true)).toBe("inactive");
  });

  it("ステップに応じた幅", () => {
    expect(calculateProgressWidth(0)).toBe(0);
    expect(calculateProgressWidth(3)).toBe(100);
  });
});
