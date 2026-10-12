import { describe, expect, it } from "vitest";
import { toPrefectureMapState } from "./prefecture-map-state";

describe("toPrefectureMapState", () => {
  it("議会がなければ none", () => {
    expect(toPrefectureMapState(undefined)).toBe("none");
  });

  it("議案がダミーだけなら dummy", () => {
    expect(toPrefectureMapState({ dummyOnly: true })).toBe("dummy");
  });

  it("実データの議案があれば real", () => {
    expect(toPrefectureMapState({ dummyOnly: false })).toBe("real");
  });
});
