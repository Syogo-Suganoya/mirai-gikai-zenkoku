import { describe, expect, it } from "vitest";
import { getCardStatusLabel, getStatusVariant } from "./bill-status";

describe("getCardStatusLabel", () => {
  it.each([
    ["introduced", "審議中"],
    ["referred_to_committee", "審議中"],
    ["continued", "継続審査"],
    ["withdrawn", "撤回"],
    ["preparing", "提出前"],
  ] as const)("%s → %s", (status, expected) => {
    expect(getCardStatusLabel(status)).toBe(expected);
  });

  it.each([
    ["passed", "可決"],
    ["amended", "修正可決"],
    ["rejected", "否決"],
    ["adopted", "採択"],
    ["not_adopted", "不採択"],
  ] as const)("議決済みは結果で表す: %s → %s", (result, expected) => {
    expect(getCardStatusLabel("decided", result)).toBe(expected);
  });

  it("結果が無い議決済みは「議決済み」", () => {
    expect(getCardStatusLabel("decided")).toBe("議決済み");
  });
});

describe("getStatusVariant", () => {
  it("審議中は light、可決は default、否決は dark、提出前は muted", () => {
    expect(getStatusVariant("referred_to_committee")).toBe("light");
    expect(getStatusVariant("decided", "passed")).toBe("default");
    expect(getStatusVariant("decided", "rejected")).toBe("dark");
    expect(getStatusVariant("preparing")).toBe("muted");
  });
});
