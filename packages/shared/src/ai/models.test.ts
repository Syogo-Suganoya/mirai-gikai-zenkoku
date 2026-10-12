import { describe, expect, it } from "vitest";
import { AI_MODELS, GEMINI_MODELS, isKnownModel } from "./models";

describe("isKnownModel", () => {
  it("登録済みのIDは true", () => {
    expect(isKnownModel(AI_MODELS.chat)).toBe(true);
    expect(isKnownModel("gemini-3.1-pro-preview")).toBe(true);
  });

  it("未登録のIDは false", () => {
    expect(isKnownModel("openai/gpt-5.2")).toBe(false);
    expect(isKnownModel("")).toBe(false);
    expect(isKnownModel("toString")).toBe(false);
  });
});

describe("AI_MODELS", () => {
  it("すべての用途に単価の分かるモデルが割り当てられている", () => {
    for (const model of Object.values(AI_MODELS)) {
      expect(GEMINI_MODELS[model]).toBeDefined();
    }
  });
});
