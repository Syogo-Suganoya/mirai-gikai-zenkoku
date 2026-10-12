import { describe, expect, it } from "vitest";
import { factionsActiveOn, isFactionActiveOn, todayInJapan } from "./factions";

describe("isFactionActiveOn", () => {
  const faction = { valid_from: "2023-05-01", valid_to: "2027-04-30" };

  it("期間の初日と最終日を含む", () => {
    expect(isFactionActiveOn(faction, "2023-05-01")).toBe(true);
    expect(isFactionActiveOn(faction, "2027-04-30")).toBe(true);
  });

  it("期間の外は無効", () => {
    expect(isFactionActiveOn(faction, "2023-04-30")).toBe(false);
    expect(isFactionActiveOn(faction, "2027-05-01")).toBe(false);
  });

  it("終了日が無ければ開始日以降はずっと有効", () => {
    const open = { valid_from: "2023-05-01", valid_to: null };
    expect(isFactionActiveOn(open, "2099-01-01")).toBe(true);
    expect(isFactionActiveOn(open, "2023-04-30")).toBe(false);
  });
});

describe("factionsActiveOn", () => {
  it("有効な会派だけを順番どおりに返す", () => {
    const factions = [
      { id: "a", valid_from: "2019-05-01", valid_to: "2023-04-30" },
      { id: "b", valid_from: "2023-05-01", valid_to: null },
      { id: "c", valid_from: "2019-05-01", valid_to: null },
    ];
    expect(factionsActiveOn(factions, "2026-09-25").map((f) => f.id)).toEqual(
      ["b", "c"]
    );
  });
});

describe("todayInJapan", () => {
  it("日本時間の日付を返す（UTC では前日でも）", () => {
    expect(todayInJapan(new Date("2026-10-11T15:30:00Z"))).toBe("2026-10-12");
    expect(todayInJapan(new Date("2026-10-11T14:59:00Z"))).toBe("2026-10-11");
  });
});
