import { describe, expect, it } from "vitest";
import { activeAssemblyKind } from "./assembly-kind-links";

const kindBySlug = {
  "aichi-pref": "prefecture",
  "nagoya-city": "city",
} as const;

describe("activeAssemblyKind", () => {
  it("区分の一覧ページならその区分", () => {
    expect(activeAssemblyKind("/")).toBe("prefecture");
    expect(activeAssemblyKind("/cities")).toBe("city");
    expect(activeAssemblyKind("/towns/")).toBe("town");
  });

  it("議会のページ・議案のページなら、その議会の区分", () => {
    expect(activeAssemblyKind("/aichi-pref", kindBySlug)).toBe("prefecture");
    expect(activeAssemblyKind("/aichi-pref/bills/1", kindBySlug)).toBe(
      "prefecture"
    );
    expect(activeAssemblyKind("/nagoya-city/sessions", kindBySlug)).toBe(
      "city"
    );
  });

  it("知らない議会や、議会以外のページでは null", () => {
    expect(activeAssemblyKind("/aichi-pref")).toBeNull();
    expect(activeAssemblyKind("/unknown", kindBySlug)).toBeNull();
    expect(activeAssemblyKind("/privacy", kindBySlug)).toBeNull();
    expect(activeAssemblyKind("/constructor", kindBySlug)).toBeNull();
  });
});
