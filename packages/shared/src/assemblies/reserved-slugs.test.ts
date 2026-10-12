import { describe, expect, it } from "vitest";
import { isReservedAssemblySlug } from "./reserved-slugs";

describe("isReservedAssemblySlug", () => {
  it("web と admin の固定のページの名前は使えない", () => {
    expect(isReservedAssemblySlug("cities")).toBe(true);
    expect(isReservedAssemblySlug("tags")).toBe(true);
    expect(isReservedAssemblySlug("login")).toBe(true);
  });

  it("ふつうの議会のスラッグは使える", () => {
    expect(isReservedAssemblySlug("aichi-pref")).toBe(false);
    expect(isReservedAssemblySlug("fukuoka-city")).toBe(false);
  });
});
