import { describe, expect, it } from "vitest";
import {
  billIdFromThumbnailKey,
  buildThumbnailKey,
  thumbnailKeyFromBlobUrl,
  thumbnailKeyFromUrl,
} from "./public-file-key";

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

describe("thumbnailKeyFromUrl", () => {
  const base = "https://files.example.com/";

  it("この置き場所のサムネイルの URL ならキーを返す", () => {
    expect(
      thumbnailKeyFromUrl(
        "https://files.example.com/bill-thumbnails/share_abc_1.png",
        base
      )
    ).toBe("bill-thumbnails/share_abc_1.png");
  });

  it("他所の URL やサムネイル以外のパスは null", () => {
    expect(
      thumbnailKeyFromUrl(
        "https://evil.example.com/bill-thumbnails/a_1.png",
        base
      )
    ).toBeNull();
    expect(
      thumbnailKeyFromUrl("https://files.example.com/other/a_1.png", base)
    ).toBeNull();
    expect(
      thumbnailKeyFromUrl(
        "https://files.example.com/bill-thumbnails/../secret.png",
        base
      )
    ).toBeNull();
  });
});

describe("thumbnailKeyFromBlobUrl", () => {
  const host = "https://abc123xyz.public.blob.vercel-storage.com";

  it("Vercel Blob のサムネイルの URL ならキーを返す", () => {
    expect(
      thumbnailKeyFromBlobUrl(`${host}/bill-thumbnails/share_abc_1.png`)
    ).toBe("bill-thumbnails/share_abc_1.png");
  });

  it("Blob 以外のホスト・http・サムネイル以外・クエリ付きは null", () => {
    expect(
      thumbnailKeyFromBlobUrl(
        "https://evil.example.com/bill-thumbnails/share_abc_1.png"
      )
    ).toBeNull();
    expect(
      thumbnailKeyFromBlobUrl(
        "https://abc.public.blob.vercel-storage.com.evil.com/bill-thumbnails/a_1.png"
      )
    ).toBeNull();
    expect(
      thumbnailKeyFromBlobUrl(
        "http://abc123xyz.public.blob.vercel-storage.com/bill-thumbnails/a_1.png"
      )
    ).toBeNull();
    expect(
      thumbnailKeyFromBlobUrl(`${host}/csv-imports/aichi-pref/a.csv`)
    ).toBeNull();
    expect(
      thumbnailKeyFromBlobUrl(`${host}/bill-thumbnails/a_1.png?x=1`)
    ).toBeNull();
    expect(thumbnailKeyFromBlobUrl("not a url")).toBeNull();
  });
});

describe("billIdFromThumbnailKey", () => {
  const billId = "e90b8a63-5ee8-47fc-9584-d16b99bdd748";

  it("議案 id を取り出す（接頭辞があってもよい）", () => {
    expect(
      billIdFromThumbnailKey(`bill-thumbnails/${billId}_1700000000000.png`)
    ).toBe(billId);
    expect(
      billIdFromThumbnailKey(
        `bill-thumbnails/share_${billId}_1700000000000.jpg`
      )
    ).toBe(billId);
  });

  it("議案を作る前に上げたものは null", () => {
    expect(
      billIdFromThumbnailKey("bill-thumbnails/new_1700000000000.png")
    ).toBeNull();
  });
});
