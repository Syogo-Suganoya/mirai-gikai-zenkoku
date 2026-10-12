import { describe, expect, it } from "vitest";

import { getBillStatusLabel } from "./index";

describe("getBillStatusLabel", () => {
  it("審議の段階をラベルにする", () => {
    expect(getBillStatusLabel("preparing")).toBe("準備中");
    expect(getBillStatusLabel("introduced")).toBe("提出");
    expect(getBillStatusLabel("referred_to_committee")).toBe("委員会で審査中");
    expect(getBillStatusLabel("continued")).toBe("継続審査");
    expect(getBillStatusLabel("withdrawn")).toBe("撤回");
  });

  it("議決済みで結果があれば結果をラベルにする", () => {
    expect(getBillStatusLabel("decided", "passed")).toBe("可決");
    expect(getBillStatusLabel("decided", "rejected")).toBe("否決");
    expect(getBillStatusLabel("decided", "adopted")).toBe("採択");
  });

  it("議決済みで結果がなければ「議決済み」", () => {
    expect(getBillStatusLabel("decided")).toBe("議決済み");
    expect(getBillStatusLabel("decided", null)).toBe("議決済み");
  });

  it("議決前なら結果は見ない", () => {
    expect(getBillStatusLabel("introduced", "passed")).toBe("提出");
  });

  it("returns the status string as-is for unknown status", () => {
    // biome-ignore lint/suspicious/noExplicitAny: テスト用に未知のステータスを渡す
    expect(getBillStatusLabel("unknown_status" as any)).toBe("unknown_status");
  });
});
