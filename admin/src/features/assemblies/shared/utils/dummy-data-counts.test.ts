import { describe, expect, it } from "vitest";
import { describeDummyCounts, hasDummyCounts } from "./dummy-data-counts";

describe("dummy-data-counts", () => {
  it("件数をまとめて書く（0件は省く）", () => {
    expect(describeDummyCounts({ sessions: 1, bills: 3, factions: 3 })).toBe(
      "会期1件・議案3件・会派3件"
    );
    expect(describeDummyCounts({ sessions: 0, bills: 2, factions: 0 })).toBe(
      "議案2件"
    );
  });

  it("どれか1件でもあればダミーあり", () => {
    expect(hasDummyCounts({ sessions: 0, bills: 0, factions: 0 })).toBe(false);
    expect(hasDummyCounts({ sessions: 0, bills: 0, factions: 1 })).toBe(true);
  });
});
