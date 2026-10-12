import { describe, expect, it } from "vitest";
import type { AssemblyMemberInput } from "../types";
import {
  normalizeMemberInput,
  validateMemberInput,
} from "./validate-member-input";

const valid: AssemblyMemberInput = {
  email: "reviewer@example.com",
  role: "reviewer",
  display_name: "山田花子",
  affiliation: "◯◯県議会議員",
};

describe("normalizeMemberInput", () => {
  it("空白を除き、メールアドレスを小文字にする", () => {
    expect(
      normalizeMemberInput({
        ...valid,
        email: " Reviewer@Example.com ",
        display_name: " 山田花子 ",
        affiliation: " ◯◯県議会議員 ",
      })
    ).toEqual(valid);
  });
});

describe("validateMemberInput", () => {
  it("正しい入力なら null", () => {
    expect(validateMemberInput(valid)).toBeNull();
  });

  it("メールアドレスが空・形式違いならエラー", () => {
    expect(validateMemberInput({ ...valid, email: "" })).toContain(
      "メールアドレス"
    );
    expect(validateMemberInput({ ...valid, email: "abc" })).toContain(
      "メールアドレス"
    );
  });

  it("知らない役割はエラー", () => {
    expect(validateMemberInput({ ...valid, role: "owner" as never })).toContain(
      "役割"
    );
  });

  it("表示名・所属は必須で100文字まで", () => {
    expect(validateMemberInput({ ...valid, display_name: "" })).toContain(
      "表示名"
    );
    expect(validateMemberInput({ ...valid, affiliation: "" })).toContain(
      "所属"
    );
    expect(
      validateMemberInput({ ...valid, affiliation: "あ".repeat(101) })
    ).toContain("100文字");
  });
});
