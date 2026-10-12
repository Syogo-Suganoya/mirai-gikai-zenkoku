import { describe, expect, it } from "vitest";
import type { Bill, BillContent } from "../types";
import { toBillWithContent } from "./to-bill-with-content";

const bill = { id: "b1", slug: null, name: "議案" } as unknown as Bill;
const content = { id: "c1", title: "タイトル" } as unknown as BillContent;

describe("toBillWithContent", () => {
  it("議会のスラッグ・解説・タグ・議決結果を画面用の形にする", () => {
    const result = toBillWithContent({
      ...bill,
      assembly: { slug: "aichi-pref" },
      bill_contents: [content],
      bills_tags: [{ tags: { id: "t1", label: "財政" } }, { tags: null }],
      bill_result: null,
    });
    expect(result.assembly_slug).toBe("aichi-pref");
    expect(result.bill_content).toBe(content);
    expect(result.tags).toEqual([{ id: "t1", label: "財政" }]);
    expect(result.bill_result).toBeUndefined();
    expect("assembly" in result).toBe(false);
    expect("bills_tags" in result).toBe(false);
  });

  it("件名と原文のみの議案は解説が undefined", () => {
    const result = toBillWithContent({
      ...bill,
      assembly: { slug: "aichi-pref" },
      bill_contents: [],
    });
    expect(result.bill_content).toBeUndefined();
    expect(result.tags).toEqual([]);
  });
});
