import { describe, expect, it } from "vitest";
import { billSourceLink } from "./bill-source-link";

describe("billSourceLink", () => {
  it("原文があれば原文を出す（資料があっても原文を優先）", () => {
    expect(
      billSourceLink({
        source_url: "https://example.com/gian.pdf",
        materials_url: "https://example.com/list.pdf",
      })
    ).toEqual({
      href: "https://example.com/gian.pdf",
      kind: "original",
      label: "議案の原文（議会のサイト）",
    });
  });

  it("原文がなければ議会のサイトの資料を出す", () => {
    expect(
      billSourceLink({
        source_url: null,
        materials_url: "https://example.com/list.pdf",
      })
    ).toEqual({
      href: "https://example.com/list.pdf",
      kind: "materials",
      label: "議会のサイトの資料",
    });
  });

  it("空文字は未登録として扱う", () => {
    expect(billSourceLink({ source_url: "", materials_url: "" })).toBeNull();
  });

  it("どちらもなければ null", () => {
    expect(
      billSourceLink({ source_url: null, materials_url: null })
    ).toBeNull();
  });
});
