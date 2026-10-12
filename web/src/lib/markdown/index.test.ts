import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./index";

describe("parseMarkdown", () => {
  it("should not allow malicious iframe elements", async () => {
    const markdown = `<iframe src="https://malicious.com/evil" onload="alert('XSS')"></iframe>

https://www.youtube.com/watch?v=safe123`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // 悪意のあるiframeは削除され、YouTube埋め込みだけが残ることを確認
    expect(html).not.toContain("malicious.com");
    expect(html).not.toContain("onload");
    expect(html).toContain('src="https://www.youtube.com/embed/safe123"');
  });

  it("ふりがなを渡すと、本文の漢字に ruby を振る", async () => {
    const result = await parseMarkdown("議案の要点\n\n予算を増やす", {
      furigana: [
        { text: "議案", reading: "ぎあん" },
        { text: "の" },
        { text: "要点", reading: "ようてん" },
        { text: "予算", reading: "よさん" },
      ],
    });
    const html = renderToStaticMarkup(result);

    expect(html).toContain(
      '<ruby>議案<rt class="furigana-rt">ぎあん</rt></ruby>'
    );
    expect(html).toContain(
      '<ruby>予算<rt class="furigana-rt">よさん</rt></ruby>'
    );
  });

  it("ふりがなが無ければ ruby を出さない", async () => {
    const html = renderToStaticMarkup(await parseMarkdown("予算を増やす"));

    expect(html).not.toContain("<ruby>");
  });
});
