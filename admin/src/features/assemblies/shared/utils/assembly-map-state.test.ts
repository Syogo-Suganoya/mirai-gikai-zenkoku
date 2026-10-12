import { describe, expect, it } from "vitest";
import { assemblyMapLabel, toAssemblyMapState } from "./assembly-map-state";

describe("toAssemblyMapState", () => {
  it("扱える議会がなければ none", () => {
    expect(toAssemblyMapState(undefined)).toBe("none");
  });

  it("議案の有無と実データ・ダミーで塗り分ける", () => {
    expect(toAssemblyMapState({ billCount: 0, dummyBillCount: 0 })).toBe(
      "empty"
    );
    expect(toAssemblyMapState({ billCount: 3, dummyBillCount: 3 })).toBe(
      "dummy"
    );
    expect(toAssemblyMapState({ billCount: 226, dummyBillCount: 0 })).toBe(
      "real"
    );
    expect(toAssemblyMapState({ billCount: 4, dummyBillCount: 3 })).toBe(
      "real"
    );
  });
});

describe("assemblyMapLabel", () => {
  it("議会名と件数", () => {
    expect(
      assemblyMapLabel({
        name: "愛知県議会",
        billCount: 226,
        publishedBillCount: 220,
        dummyBillCount: 0,
      })
    ).toBe("愛知県議会 議案226件（公開中220件）");
    expect(
      assemblyMapLabel({
        name: "東京都議会",
        billCount: 3,
        publishedBillCount: 3,
        dummyBillCount: 3,
      })
    ).toBe("東京都議会 議案3件（公開中3件・ダミー）");
    expect(
      assemblyMapLabel({
        name: "北海道議会",
        billCount: 0,
        publishedBillCount: 0,
        dummyBillCount: 0,
      })
    ).toBe("北海道議会 議案なし");
  });
});
