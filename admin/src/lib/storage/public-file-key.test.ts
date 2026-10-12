import { describe, expect, it } from "vitest";
import { buildThumbnailKey, keyFromPublicUrl } from "./public-file-key";

describe("buildThumbnailKey", () => {
  it("接頭辞・議案 id・時刻・拡張子からキーを作る", () => {
    expect(
      buildThumbnailKey({
        fileName: "photo.PNG",
        billId: "abc-123",
        prefix: "share",
        now: 1700000000000,
      })
    ).toBe("bill-thumbnails/share_abc-123_1700000000000.png");
  });

  it("議案 id が無ければ new、パスに使えない文字は落とす", () => {
    expect(
      buildThumbnailKey({ fileName: "../../x.j/pg", now: 1, prefix: "a/b" })
    ).toBe("bill-thumbnails/ab_new_1.bin");
  });
});

describe("keyFromPublicUrl", () => {
  const base = "https://files.example.com/";

  it("この置き場所のサムネイルの URL ならキーを返す", () => {
    expect(
      keyFromPublicUrl(
        "https://files.example.com/bill-thumbnails/share_abc_1.png",
        base
      )
    ).toBe("bill-thumbnails/share_abc_1.png");
  });

  it("他所の URL やサムネイル以外のパスは null", () => {
    expect(
      keyFromPublicUrl("https://evil.example.com/bill-thumbnails/a_1.png", base)
    ).toBeNull();
    expect(
      keyFromPublicUrl("https://files.example.com/other/a_1.png", base)
    ).toBeNull();
    expect(
      keyFromPublicUrl(
        "https://files.example.com/bill-thumbnails/../secret.png",
        base
      )
    ).toBeNull();
  });
});
