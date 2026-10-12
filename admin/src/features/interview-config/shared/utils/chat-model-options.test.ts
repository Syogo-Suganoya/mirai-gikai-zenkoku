import { isKnownModel } from "@mirai-gikai/shared/ai/models";
import { describe, expect, it } from "vitest";
import {
  CHAT_MODEL_GROUPS,
  CHAT_MODEL_OPTIONS,
  isValidChatModel,
} from "./chat-model-options";

describe("CHAT_MODEL_OPTIONS", () => {
  it("全てのオプションが Gemini のモデル ID を持つ", () => {
    for (const option of CHAT_MODEL_OPTIONS) {
      expect(option.value).toMatch(/^gemini-/);
    }
  });

  // UI で選べるモデルは必ず AI_MODELS（isKnownModel）のサブセットであること。
  // ここが崩れると、UI で選べるのに backfill dispatch が「未知のモデルID」で
  // 400 を返す乖離が起きる。
  it("全てのオプションが AI_MODELS に登録済み（isKnownModel=true）", () => {
    for (const option of CHAT_MODEL_OPTIONS) {
      expect(isKnownModel(option.value)).toBe(true);
    }
  });

  it("全てのオプションがラベルを持つ", () => {
    for (const option of CHAT_MODEL_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("重複するvalueがない", () => {
    const values = CHAT_MODEL_OPTIONS.map((opt) => opt.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("CHAT_MODEL_GROUPS", () => {
  it("Google（Gemini）のグループだけが存在する", () => {
    expect(CHAT_MODEL_GROUPS.map((g) => g.provider)).toEqual(["Google"]);
  });

  it("全グループのモデル数がフラット一覧と一致する", () => {
    const groupTotal = CHAT_MODEL_GROUPS.reduce(
      (sum, g) => sum + g.options.length,
      0
    );
    expect(groupTotal).toBe(CHAT_MODEL_OPTIONS.length);
  });

  it("全モデルに推定コストが設定されている", () => {
    for (const group of CHAT_MODEL_GROUPS) {
      for (const option of group.options) {
        expect(option.estimatedCost).not.toBeNull();
        expect(option.estimatedCost).toMatch(/^~\d+円$/);
      }
    }
  });
});

describe("isValidChatModel", () => {
  it("有効なモデルIDに対してtrueを返す", () => {
    expect(isValidChatModel("gemini-3.8-flash")).toBe(true);
    expect(isValidChatModel("gemini-3.1-pro-preview")).toBe(true);
  });

  it("無効なモデルIDに対してfalseを返す", () => {
    expect(isValidChatModel("invalid-model")).toBe(false);
    expect(isValidChatModel("openai/gpt-4o-mini")).toBe(false);
    expect(isValidChatModel("")).toBe(false);
  });
});
