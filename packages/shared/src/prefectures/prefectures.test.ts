import { describe, expect, it } from "vitest";
import {
  findPrefectureByCode,
  findPrefectureByRomaji,
  PREFECTURES,
  prefectureAssemblySlug,
  prefectureLocalGovCode,
  shortPrefectureName,
  withCheckDigit,
} from "./prefectures";

describe("PREFECTURES", () => {
  it("47都道府県がコード順に並んでいる", () => {
    expect(PREFECTURES).toHaveLength(47);
    expect(PREFECTURES.map((p) => Number(p.code))).toEqual(
      Array.from({ length: 47 }, (_, i) => i + 1)
    );
  });
});

describe("withCheckDigit", () => {
  it("実在の団体コードと一致する", () => {
    expect(withCheckDigit("23000")).toBe("230006"); // 愛知県
    expect(withCheckDigit("01000")).toBe("010006"); // 北海道
    expect(withCheckDigit("13000")).toBe("130001"); // 東京都
    expect(withCheckDigit("40130")).toBe("401307"); // 福岡市
    expect(withCheckDigit("47000")).toBe("470007"); // 沖縄県
  });

  it("5桁の数字以外は受け付けない", () => {
    expect(() => withCheckDigit("2300")).toThrow();
    expect(() => withCheckDigit("2300a")).toThrow();
  });
});

describe("prefectureLocalGovCode", () => {
  it("都道府県コードから団体コードを作る", () => {
    expect(prefectureLocalGovCode("23")).toBe("230006");
    expect(prefectureLocalGovCode("1")).toBe("010006");
  });
});

describe("find", () => {
  it("コードとローマ字で引ける", () => {
    expect(findPrefectureByCode("23")?.name).toBe("愛知県");
    expect(findPrefectureByCode("1")?.name).toBe("北海道");
    expect(findPrefectureByRomaji("okinawa")?.code).toBe("47");
    expect(findPrefectureByCode("48")).toBeUndefined();
  });
});

describe("名前とスラッグ", () => {
  it("短い名前とスラッグを作る", () => {
    expect(shortPrefectureName("愛知県")).toBe("愛知");
    expect(shortPrefectureName("東京都")).toBe("東京");
    expect(shortPrefectureName("京都府")).toBe("京都");
    expect(shortPrefectureName("北海道")).toBe("北海道");
    const aichi = findPrefectureByCode("23");
    expect(aichi && prefectureAssemblySlug(aichi)).toBe("aichi-pref");
  });
});
