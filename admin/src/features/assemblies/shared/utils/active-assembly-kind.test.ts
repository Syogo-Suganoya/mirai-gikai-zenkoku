import { describe, expect, it } from "vitest";
import { activeAssemblyKind } from "./active-assembly-kind";

const kindBySlug = {
  "aichi-pref": "prefecture",
  "nagoya-city": "city",
} as const;

describe("activeAssemblyKind", () => {
  it("議会一覧は ?kind の区分（無ければ都道府県）", () => {
    expect(activeAssemblyKind("/", null, kindBySlug)).toBe("prefecture");
    expect(activeAssemblyKind("/", "city", kindBySlug)).toBe("city");
    expect(activeAssemblyKind("/", "unknown", kindBySlug)).toBe("prefecture");
  });

  it("議会の画面はその議会の区分", () => {
    expect(activeAssemblyKind("/aichi-pref/bills", null, kindBySlug)).toBe(
      "prefecture"
    );
    expect(activeAssemblyKind("/nagoya-city/settings", null, kindBySlug)).toBe(
      "city"
    );
  });

  it("それ以外の画面は null", () => {
    expect(activeAssemblyKind("/tags", null, kindBySlug)).toBeNull();
    expect(activeAssemblyKind("/bills/abc/edit", null, kindBySlug)).toBeNull();
    expect(activeAssemblyKind("/constructor", null, kindBySlug)).toBeNull();
  });
});
