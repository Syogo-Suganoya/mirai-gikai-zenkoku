import { describe, expect, it } from "vitest";
import { webBillPath, webBillPreviewPath } from "./web-bill-paths";

describe("webBillPath", () => {
  it("議会のスラッグと議案の目印からパスを作る", () => {
    expect(webBillPath("aichi-pref", "abc")).toBe("/aichi-pref/bills/abc");
  });

  it("下のパスを付けられる", () => {
    expect(webBillPath("aichi-pref", "abc", "/interview")).toBe(
      "/aichi-pref/bills/abc/interview"
    );
  });

  it("議案の目印はエンコードする", () => {
    expect(webBillPath("aichi-pref", "a b")).toBe("/aichi-pref/bills/a%20b");
  });
});

describe("webBillPreviewPath", () => {
  it("/preview を前に付ける", () => {
    expect(webBillPreviewPath("aichi-pref", "abc", "/interview")).toBe(
      "/preview/aichi-pref/bills/abc/interview"
    );
  });
});
