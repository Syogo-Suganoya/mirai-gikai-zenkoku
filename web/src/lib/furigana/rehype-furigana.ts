import {
  applyReadings,
  type ReadingDictionary,
} from "@mirai-gikai/shared/furigana/apply";
import type { Element, ElementContent, Root, Text } from "hast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

/** ふりがなを振らない要素 */
const SKIP_TAGS = new Set(["code", "pre", "ruby", "rt", "script", "style"]);

function toRubyNodes(
  text: string,
  dictionary: ReadingDictionary
): ElementContent[] {
  return applyReadings(text, dictionary).map(
    (segment): ElementContent =>
      segment.reading
        ? {
            type: "element",
            tagName: "ruby",
            properties: {},
            children: [
              { type: "text", value: segment.text },
              {
                type: "element",
                tagName: "rt",
                properties: { className: ["furigana-rt"] },
                children: [{ type: "text", value: segment.reading }],
              },
            ],
          }
        : { type: "text", value: segment.text }
  );
}

/**
 * 解説の本文（Markdown を描画したもの）に、保存済みのふりがなを当てる rehype プラグイン。
 * サニタイズの後に使う（ruby・rt はここで足すので、サニタイズの許可リストに入れなくてよい）。
 */
export const rehypeFurigana: Plugin<[ReadingDictionary], Root> =
  (dictionary) => (tree) => {
    if (dictionary.readings.size === 0) return;
    visit(tree, (node, index, parent) => {
      if (node.type === "element" && SKIP_TAGS.has((node as Element).tagName)) {
        return SKIP;
      }
      if (node.type !== "text" || !parent || index === undefined) return;
      const replaced = toRubyNodes((node as Text).value, dictionary);
      if (replaced.length === 1 && replaced[0].type === "text") return;
      (parent as Element).children.splice(index, 1, ...replaced);
      return [SKIP, index + replaced.length];
    });
  };
