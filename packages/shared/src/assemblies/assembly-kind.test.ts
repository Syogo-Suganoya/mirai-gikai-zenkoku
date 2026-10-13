import { describe, expect, it } from "vitest";
import { toAssemblyKind } from "./assembly-kind";

describe("toAssemblyKind", () => {
  it("特別区・町・村は区町村にまとめる", () => {
    expect(toAssemblyKind("prefecture")).toBe("prefecture");
    expect(toAssemblyKind("city")).toBe("city");
    expect(toAssemblyKind("special_ward")).toBe("town");
    expect(toAssemblyKind("town")).toBe("town");
    expect(toAssemblyKind("village")).toBe("town");
  });
});
