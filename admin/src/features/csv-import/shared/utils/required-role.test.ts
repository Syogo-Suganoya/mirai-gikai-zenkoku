import { describe, expect, it } from "vitest";
import { requiredRoleForCsvKind } from "./required-role";

describe("requiredRoleForCsvKind", () => {
  it("議案は編集者から取り込める", () => {
    expect(requiredRoleForCsvKind("bills")).toBe("editor");
  });

  it.each([
    ["results"],
    ["sessions"],
    ["factions"],
  ] as const)("%s は確認者以上", (kind) => {
    expect(requiredRoleForCsvKind(kind)).toBe("reviewer");
  });
});
