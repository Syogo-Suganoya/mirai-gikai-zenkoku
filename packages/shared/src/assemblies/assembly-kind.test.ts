import { describe, expect, it } from "vitest";
import { parseAssemblyKind, toAssemblyKind } from "./assembly-kind";

describe("toAssemblyKind", () => {
  it("特別区・町・村は区町村にまとめる", () => {
    expect(toAssemblyKind("prefecture")).toBe("prefecture");
    expect(toAssemblyKind("city")).toBe("city");
    expect(toAssemblyKind("special_ward")).toBe("town");
    expect(toAssemblyKind("town")).toBe("town");
    expect(toAssemblyKind("village")).toBe("town");
  });
});

describe("parseAssemblyKind", () => {
  it("区分の値はそのまま、それ以外は都道府県", () => {
    expect(parseAssemblyKind("city")).toBe("city");
    expect(parseAssemblyKind("town")).toBe("town");
    expect(parseAssemblyKind("prefecture")).toBe("prefecture");
    expect(parseAssemblyKind("village")).toBe("prefecture");
    expect(parseAssemblyKind(undefined)).toBe("prefecture");
    expect(parseAssemblyKind(["city"])).toBe("prefecture");
  });
});
