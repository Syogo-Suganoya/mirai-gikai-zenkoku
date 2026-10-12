import { describe, expect, it } from "vitest";
import { hasAssemblyRole, resolveAssemblyRole } from "./assembly-role";

describe("hasAssemblyRole", () => {
  it("同じかより強い役割なら true", () => {
    expect(hasAssemblyRole("reviewer", "editor")).toBe(true);
    expect(hasAssemblyRole("reviewer", "reviewer")).toBe(true);
    expect(hasAssemblyRole("super_admin", "reviewer")).toBe(true);
  });

  it("弱い役割・役割なしは false", () => {
    expect(hasAssemblyRole("editor", "reviewer")).toBe(false);
    expect(hasAssemblyRole(null, "editor")).toBe(false);
  });
});

describe("resolveAssemblyRole", () => {
  it("全体管理者は担当に関係なく super_admin", () => {
    expect(resolveAssemblyRole(true, null)).toBe("super_admin");
  });

  it("全体管理者でなければ担当の役割", () => {
    expect(resolveAssemblyRole(false, "editor")).toBe("editor");
    expect(resolveAssemblyRole(false, null)).toBeNull();
  });
});
