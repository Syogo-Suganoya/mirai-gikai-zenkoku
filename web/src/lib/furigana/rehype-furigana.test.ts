import { buildReadingDictionary } from "@mirai-gikai/shared/furigana/apply";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeFurigana } from "./rehype-furigana";

async function render(markdown: string) {
  const dictionary = buildReadingDictionary([
    { text: "予算", reading: "よさん" },
    { text: "条例", reading: "じょうれい" },
  ]);
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeFurigana, dictionary)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}

describe("rehypeFurigana", () => {
  it("見出し・強調の中の語にもふりがなを振る", async () => {
    const html = await render("## 予算\n\n**条例**を決める");
    expect(html).toContain(
      '<h2><ruby>予算<rt class="furigana-rt">よさん</rt></ruby></h2>'
    );
    expect(html).toContain(
      '<strong><ruby>条例<rt class="furigana-rt">じょうれい</rt></ruby></strong>を決める'
    );
  });

  it("コードの中には振らない", async () => {
    const html = await render("`予算`");
    expect(html).toBe("<p><code>予算</code></p>");
  });
});
