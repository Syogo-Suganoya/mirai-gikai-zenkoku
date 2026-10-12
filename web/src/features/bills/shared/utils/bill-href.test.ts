import { describe, expect, it } from "vitest";
import { billDetailHref } from "./bill-href";

describe("billDetailHref", () => {
  it("slug があれば slug、なければ id で議会の下の URL を作る", () => {
    expect(
      billDetailHref({ id: "b1", slug: "kodomo", assembly_slug: "aichi-pref" })
    ).toBe("/aichi-pref/bills/kodomo");
    expect(
      billDetailHref({ id: "b1", slug: null, assembly_slug: "aichi-pref" })
    ).toBe("/aichi-pref/bills/b1");
  });
});
