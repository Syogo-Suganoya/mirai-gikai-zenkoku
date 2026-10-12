import { describe, expect, it } from "vitest";
import { applyReadings, buildReadingDictionary } from "./apply";

describe("buildReadingDictionary / applyReadings", () => {
  const dictionary = buildReadingDictionary([
    { text: "## " },
    { text: "予算", reading: "よさん" },
    { text: "を" },
    { text: "決", reading: "き" },
    { text: "める。" },
    { text: "一般会計", reading: "いっぱんかいけい" },
    { text: "一般", reading: "いっぱん" },
    { text: "予算", reading: "まちがい" },
  ]);

  it("描画後の文章に最長一致で読みを当てる", () => {
    expect(applyReadings("一般会計の予算を決める", dictionary)).toEqual([
      { text: "一般会計", reading: "いっぱんかいけい" },
      { text: "の" },
      { text: "予算", reading: "よさん" },
      { text: "を" },
      { text: "決", reading: "き" },
      { text: "める" },
    ]);
  });

  it("辞書の語が無ければそのまま返す", () => {
    expect(applyReadings("ひらがなだけ", dictionary)).toEqual([
      { text: "ひらがなだけ" },
    ]);
    expect(applyReadings("", dictionary)).toEqual([]);
  });

  it("ふりがなが無いときは文章をそのまま返す", () => {
    expect(applyReadings("予算", buildReadingDictionary(null))).toEqual([
      { text: "予算" },
    ]);
  });
});
