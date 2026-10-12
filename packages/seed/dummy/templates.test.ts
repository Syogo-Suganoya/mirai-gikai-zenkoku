import { describe, expect, it } from "vitest";
import { DUMMY_THEMES } from "./prefectures";
import { buildDummyBills, DUMMY_PREFIX, disclaimer, dummyGranularity } from "./templates";

describe("ダミーの題材", () => {
  it("愛知県以外の46都道府県がある", () => {
    expect(DUMMY_THEMES).toHaveLength(46);
    expect(DUMMY_THEMES.map((t) => t.prefecture)).not.toContain("愛知県");
  });
});

describe("buildDummyBills", () => {
  const theme = DUMMY_THEMES[0];

  it("件名にはすべて【ダミー】が付く", () => {
    for (const bill of buildDummyBills(theme, 0)) {
      expect(bill.name.startsWith(DUMMY_PREFIX)).toBe(true);
    }
  });

  it("解説の冒頭に架空である旨が入り、数字を含まない", () => {
    const [explained] = buildDummyBills(theme, 0);
    for (const content of explained.contents) {
      expect(content.content.startsWith(`> ${disclaimer(theme)}`)).toBe(true);
      expect(content.content).not.toMatch(/[0-9０-９]/);
    }
  });

  it("第3号の議決結果と粒度は都道府県ごとに順番に変わる", () => {
    const results = [0, 1, 2, 3, 4].map((i) => buildDummyBills(theme, i)[2].result);
    expect(results).toEqual(["passed", "amended", "rejected", "continued", "passed"]);
    expect([0, 1, 2, 3].map(dummyGranularity)).toEqual([
      "faction",
      "count",
      "result_only",
      "faction",
    ]);
  });
});
