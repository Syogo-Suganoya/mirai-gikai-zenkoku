import { describe, expect, it } from "vitest";
import { validateNewPassword } from "./password-policy";

describe("validateNewPassword", () => {
  it("確認と一致すれば短くても null", () => {
    expect(validateNewPassword("123456", "123456")).toBeNull();
    expect(validateNewPassword("a", "a")).toBeNull();
  });

  it("空ならエラー", () => {
    expect(validateNewPassword("", "")).toContain("入力してください");
  });

  it("確認と一致しなければエラー", () => {
    expect(validateNewPassword("abcdef", "abcdeg")).toContain("一致しません");
  });
});
