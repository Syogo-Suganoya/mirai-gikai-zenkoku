import { describe, expect, it } from "vitest";
import { isInterviewEnabled } from "./is-interview-enabled";

describe("isInterviewEnabled", () => {
  it("議会の設定で出していて、実在の議案なら出す", () => {
    expect(
      isInterviewEnabled({ show_interview: true }, { is_dummy: false })
    ).toBe(true);
  });

  it("議会の設定で出していなければ出さない", () => {
    expect(
      isInterviewEnabled({ show_interview: false }, { is_dummy: false })
    ).toBe(false);
  });

  it("ダミーの議案には出さない", () => {
    expect(
      isInterviewEnabled({ show_interview: true }, { is_dummy: true })
    ).toBe(false);
  });
});
