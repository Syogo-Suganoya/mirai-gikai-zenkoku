import { describe, expect, it } from "vitest";
import type { AssemblySettingsInput } from "../types";
import {
  featureVisibility,
  validateAssemblySettings,
} from "./validate-assembly-settings";

const base: AssemblySettingsInput = {
  show_ai_chat: true,
  show_interview: false,
  show_mirai_stance: false,
  vote_granularity: "result_only",
  default_publish_level: "title_only",
  interview_recipient_confirmed: false,
};
const context = { hasMiraiMember: false, currentShowInterview: false };

describe("validateAssemblySettings", () => {
  it("既定の設定なら null", () => {
    expect(validateAssemblySettings(base, context)).toBeNull();
  });

  it("知らない粒度・掲載のしかたはエラー", () => {
    expect(
      validateAssemblySettings(
        { ...base, vote_granularity: "x" as never },
        context
      )
    ).toContain("粒度");
    expect(
      validateAssemblySettings(
        { ...base, default_publish_level: "x" as never },
        context
      )
    ).toContain("掲載のしかた");
  });

  it("議員のいない議会ではスタンスを出せない", () => {
    const input = { ...base, show_mirai_stance: true };
    expect(validateAssemblySettings(input, context)).toContain("スタンス");
    expect(
      validateAssemblySettings(input, { ...context, hasMiraiMember: true })
    ).toBeNull();
  });

  it("インタビューを新しく出すときは届け先の確認が要る", () => {
    const input = { ...base, show_interview: true };
    expect(validateAssemblySettings(input, context)).toContain("届け先");
    expect(
      validateAssemblySettings(
        { ...input, interview_recipient_confirmed: true },
        context
      )
    ).toBeNull();
  });

  it("すでに出しているインタビューは確認なしで保存できる", () => {
    expect(
      validateAssemblySettings(
        { ...base, show_interview: true },
        { ...context, currentShowInterview: true }
      )
    ).toBeNull();
  });
});

describe("featureVisibility", () => {
  it("オフなら off", () => {
    expect(featureVisibility(false, 10)).toBe("off");
  });

  it("オンでデータがあれば shown、0件なら hidden_no_data", () => {
    expect(featureVisibility(true, 1)).toBe("shown");
    expect(featureVisibility(true, 0)).toBe("hidden_no_data");
  });
});
