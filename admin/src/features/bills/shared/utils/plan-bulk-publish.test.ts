import { describe, expect, it } from "vitest";
import { planBulkPublishStatus } from "./plan-bulk-publish";

const bill = (
  id: string,
  publish_status: "draft" | "published" | "coming_soon"
) => ({ id, publish_status });

describe("planBulkPublishStatus", () => {
  it("公開状態が変わる議案だけを対象にする", () => {
    expect(
      planBulkPublishStatus(
        [bill("1", "draft"), bill("2", "coming_soon")],
        "published"
      )
    ).toEqual({ targetIds: ["1", "2"], unchangedCount: 0 });
  });

  it("すでにその状態の議案は対象から外す", () => {
    expect(
      planBulkPublishStatus(
        [bill("1", "draft"), bill("2", "published")],
        "published"
      )
    ).toEqual({ targetIds: ["1"], unchangedCount: 1 });
  });

  it("下書きに戻すときも同じ", () => {
    expect(planBulkPublishStatus([bill("1", "published")], "draft")).toEqual({
      targetIds: ["1"],
      unchangedCount: 0,
    });
  });
});
