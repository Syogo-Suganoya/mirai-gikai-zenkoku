import { describe, expect, it } from "vitest";
import type { AssemblySummary } from "../types";
import {
  prefectureAssemblyByCode,
  sortAssembliesForSelect,
} from "./sort-assemblies";

const item = (
  overrides: Partial<AssemblySummary> & Pick<AssemblySummary, "slug">
): AssemblySummary => ({
  id: overrides.slug,
  name: overrides.slug,
  type: "prefecture",
  prefecture_code: "01",
  publishedBillCount: 1,
  dummyOnly: false,
  activeSessionName: null,
  ...overrides,
});

describe("sortAssembliesForSelect", () => {
  it("実データのある議会を先に、ダミーだけの議会を後に並べる", () => {
    const sorted = sortAssembliesForSelect([
      item({ slug: "hokkaido", prefecture_code: "01", dummyOnly: true }),
      item({ slug: "nagoya", prefecture_code: "23", type: "city" }),
      item({ slug: "aichi", prefecture_code: "23" }),
      item({ slug: "okinawa", prefecture_code: "47", dummyOnly: true }),
    ]);
    expect(sorted.map((a) => a.slug)).toEqual([
      "aichi",
      "nagoya",
      "hokkaido",
      "okinawa",
    ]);
  });
});

describe("prefectureAssemblyByCode", () => {
  it("都道府県コードごとに都道府県議会を1件ずつ対応させる", () => {
    const map = prefectureAssemblyByCode([
      item({ slug: "aichi", prefecture_code: "23" }),
      item({ slug: "hokkaido", prefecture_code: "01" }),
    ]);
    expect(map["23"]?.slug).toBe("aichi");
    expect(map["01"]?.slug).toBe("hokkaido");
  });

  it("市区町村議会は含めない", () => {
    const map = prefectureAssemblyByCode([
      item({ slug: "nagoya", prefecture_code: "23", type: "city" }),
    ]);
    expect(map["23"]).toBeUndefined();
  });
});
