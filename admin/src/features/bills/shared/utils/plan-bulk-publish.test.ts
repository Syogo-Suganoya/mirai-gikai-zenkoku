import { describe, expect, it } from "vitest";
import { planBulkPublishStatus } from "./plan-bulk-publish";

const bill = (
  id: string,
  publish_status: "draft" | "published" | "coming_soon",
  publish_level: "title_only" | "explained" = "title_only"
) => ({ id, publish_status, publish_level });

describe("planBulkPublishStatus", () => {
  it("件名のみの議案の公開は編集者でもできる", () => {
    expect(
      planBulkPublishStatus(
        [bill("1", "draft"), bill("2", "coming_soon")],
        "published"
      )
    ).toEqual({
      targetIds: ["1", "2"],
      unchangedCount: 0,
      requiredRole: "editor",
    });
  });

  it("すでにその状態の議案は対象から外す", () => {
    expect(
      planBulkPublishStatus(
        [bill("1", "draft"), bill("2", "published")],
        "published"
      )
    ).toMatchObject({ targetIds: ["1"], unchangedCount: 1 });
  });

  it("解説ありの議案を公開するときは確認者以上", () => {
    expect(
      planBulkPublishStatus(
        [bill("1", "draft"), bill("2", "draft", "explained")],
        "published"
      ).requiredRole
    ).toBe("reviewer");
  });

  it("公開済みの解説ありの議案は対象外なので確認者は要らない", () => {
    expect(
      planBulkPublishStatus(
        [bill("1", "draft"), bill("2", "published", "explained")],
        "published"
      ).requiredRole
    ).toBe("editor");
  });

  it("非公開に戻すのは編集者でもできる", () => {
    expect(
      planBulkPublishStatus([bill("1", "published", "explained")], "draft")
        .requiredRole
    ).toBe("editor");
  });
});
