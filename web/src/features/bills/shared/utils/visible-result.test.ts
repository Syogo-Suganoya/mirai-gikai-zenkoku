import { describe, expect, it } from "vitest";
import { visibleResultFields } from "./visible-result";

const counts = { yes_count: 40, no_count: 5 };
const noCounts = { yes_count: null, no_count: null };

describe("visibleResultFields", () => {
  it("可否のみの議会は結果だけ出す", () => {
    expect(visibleResultFields("result_only", counts, 3)).toEqual({
      result: true,
      counts: false,
      factions: false,
    });
  });

  it("票数のみの議会は票数も出す（データがあるときだけ）", () => {
    expect(visibleResultFields("count", counts, 0).counts).toBe(true);
    expect(visibleResultFields("count", noCounts, 0).counts).toBe(false);
  });

  it("会派別の議会は会派ごとの賛否も出す（データがあるときだけ）", () => {
    expect(visibleResultFields("faction", counts, 3).factions).toBe(true);
    expect(visibleResultFields("faction", counts, 0).factions).toBe(false);
  });

  it("非公開・結果なしは何も出さない", () => {
    expect(visibleResultFields("unpublished", counts, 3).result).toBe(false);
    expect(visibleResultFields("faction", null, 3).result).toBe(false);
  });
});
