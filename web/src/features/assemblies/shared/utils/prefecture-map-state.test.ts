import { describe, expect, it } from "vitest";
import { toPrefectureMapState } from "./prefecture-map-state";

describe("toPrefectureMapState", () => {
  it("議会がなければ none", () => {
    expect(toPrefectureMapState(undefined)).toBe("none");
  });

  it("議案がダミーだけなら dummy", () => {
    expect(
      toPrefectureMapState({ dummyOnly: true, activeSessionName: null })
    ).toBe("dummy");
  });

  it("実データの議案があれば real", () => {
    expect(
      toPrefectureMapState({ dummyOnly: false, activeSessionName: null })
    ).toBe("real");
  });

  it("開会中なら、実データでもダミーでも in_session", () => {
    expect(
      toPrefectureMapState({
        dummyOnly: false,
        activeSessionName: "令和8年9月定例会",
      })
    ).toBe("in_session");
    expect(
      toPrefectureMapState({
        dummyOnly: true,
        activeSessionName: "令和8年9月定例会",
      })
    ).toBe("in_session");
  });
});
