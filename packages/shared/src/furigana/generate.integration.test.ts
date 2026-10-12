import { describe, expect, it } from "vitest";
import { segmentsToText } from "./segments";
import { toFurigana, toFuriganaMultiline } from "./generate";

describe("toFurigana（kuromoji の辞書を使う）", () => {
  it("件名にふりがなを振り、元の文章に戻せる", async () => {
    const name = "令和7年度愛知県一般会計補正予算（第5号）";
    const segments = await toFurigana(name);
    expect(segmentsToText(segments)).toBe(name);
    expect(segments).toContainEqual({ text: "予算", reading: "よさん" });
    expect(segments).toContainEqual({ text: "令", reading: "れい" });
  });

  it("複数行の本文は改行を残す", async () => {
    const text = "## ポイント\n- 予算を決める";
    const segments = await toFuriganaMultiline(text);
    expect(segmentsToText(segments)).toBe(text);
  });
});
