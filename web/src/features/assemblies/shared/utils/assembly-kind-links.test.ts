import { describe, expect, it } from "vitest";
import { activeAssemblyKind } from "./assembly-kind-links";

describe("activeAssemblyKind", () => {
  it("区分の一覧ページならその区分", () => {
    expect(activeAssemblyKind("/")).toBe("prefecture");
    expect(activeAssemblyKind("/cities")).toBe("city");
    expect(activeAssemblyKind("/towns/")).toBe("town");
  });

  it("議会や議案のページでは null", () => {
    expect(activeAssemblyKind("/aichi-pref")).toBeNull();
    expect(activeAssemblyKind("/aichi-pref/bills")).toBeNull();
  });
});
