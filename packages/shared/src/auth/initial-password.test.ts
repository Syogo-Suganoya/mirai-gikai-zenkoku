import { describe, expect, it } from "vitest";
import { generateInitialPassword } from "./initial-password";

describe("generateInitialPassword", () => {
  it("16文字で、読み間違えやすい文字を含まない", () => {
    for (let i = 0; i < 50; i++) {
      const password = generateInitialPassword();
      expect(password).toHaveLength(16);
      expect(password).not.toMatch(/[0O1lI]/);
    }
  });

  it("乱数の関数を差し替えると決まった値になる", () => {
    expect(generateInitialPassword(() => 0)).toBe("a".repeat(16));
  });
});
