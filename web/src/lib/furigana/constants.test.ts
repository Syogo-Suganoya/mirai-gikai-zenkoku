import { describe, expect, it } from "vitest";
import { isFuriganaOn, isFuriganaOnInCookieString } from "./constants";

describe("isFuriganaOn", () => {
  it("on のときだけ表示する", () => {
    expect(isFuriganaOn("on")).toBe(true);
    expect(isFuriganaOn("off")).toBe(false);
    expect(isFuriganaOn(undefined)).toBe(false);
  });

  it("Cookie の文字列から読む", () => {
    expect(isFuriganaOnInCookieString("a=1; furigana=on; b=2")).toBe(true);
    expect(isFuriganaOnInCookieString("furigana=off")).toBe(false);
    expect(isFuriganaOnInCookieString("xfurigana=on")).toBe(false);
    expect(isFuriganaOnInCookieString("")).toBe(false);
  });
});
