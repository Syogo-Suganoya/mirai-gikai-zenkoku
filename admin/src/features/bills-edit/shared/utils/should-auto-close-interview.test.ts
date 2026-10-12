import { describe, expect, it } from "vitest";
import { shouldAutoCloseInterviewOnBillStatus } from "./should-auto-close-interview";

describe("shouldAutoCloseInterviewOnBillStatus", () => {
  it.each([
    ["decided"],
    ["withdrawn"],
  ] as const)("%s のときは true を返す", (status) => {
    expect(shouldAutoCloseInterviewOnBillStatus(status)).toBe(true);
  });

  it.each([
    ["preparing"],
    ["introduced"],
    ["referred_to_committee"],
    ["continued"],
  ] as const)("%s のときは false を返す", (status) => {
    expect(shouldAutoCloseInterviewOnBillStatus(status)).toBe(false);
  });
});
