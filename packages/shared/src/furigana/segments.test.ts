import { describe, expect, it } from "vitest";
import {
  editableTextToSegments,
  segmentsToEditableText,
  segmentsToText,
  splitTokenFurigana,
  tokensToSegments,
} from "./segments";

describe("splitTokenFurigana", () => {
  it("送り仮名には振らない", () => {
    expect(splitTokenFurigana("育てよう", "そだてよう")).toEqual([
      { text: "育", reading: "そだ" },
      { text: "てよう" },
    ]);
  });

  it("漢字だけのトークンは全体に振る", () => {
    expect(splitTokenFurigana("予算", "よさん")).toEqual([
      { text: "予算", reading: "よさん" },
    ]);
  });
});

describe("tokensToSegments", () => {
  it("カタカナの読みをひらがなにし、ふりがな無しの部分は結合する", () => {
    const segments = tokensToSegments([
      { surface_form: "令", reading: "リョウ" },
      { surface_form: "和", reading: "ワ" },
      { surface_form: "8", reading: undefined },
      { surface_form: "年度", reading: "ネンド" },
      { surface_form: "の", reading: "ノ" },
      { surface_form: "（", reading: "（" },
      { surface_form: "予算", reading: "ヨサン" },
    ]);
    expect(segments).toEqual([
      { text: "令", reading: "れい" },
      { text: "和", reading: "わ" },
      { text: "8" },
      { text: "年度", reading: "ねんど" },
      { text: "の（" },
      { text: "予算", reading: "よさん" },
    ]);
    expect(segmentsToText(segments)).toBe("令和8年度の（予算");
  });

  it("読みが分からない漢字には振らない", () => {
    expect(tokensToSegments([{ surface_form: "髙", reading: "*" }])).toEqual([
      { text: "髙" },
    ]);
  });
});

describe("編集用の形との相互変換", () => {
  it("往復で元に戻る", () => {
    const segments = [
      { text: "愛知", reading: "あいち" },
      { text: "県", reading: "けん" },
      { text: "の" },
      { text: "予算", reading: "よさん" },
      { text: "（第5号）" },
    ];
    const text = segmentsToEditableText(segments);
    expect(text).toBe("愛知(あいち)県(けん)の予算(よさん)（第5号）");
    expect(editableTextToSegments(text)).toEqual(segments);
  });

  it("全角のかっこも受け付ける", () => {
    expect(editableTextToSegments("蒲郡（がまごおり）市")).toEqual([
      { text: "蒲郡", reading: "がまごおり" },
      { text: "市" },
    ]);
  });
});
