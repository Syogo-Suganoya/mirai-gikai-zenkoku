import { describe, expect, it } from "vitest";
import { isReportAnalyzable } from "./analyzable";

describe("isReportAnalyzable", () => {
  it("住民と管理者の両方が公開しているときだけ対象", () => {
    expect(
      isReportAnalyzable({ is_public_by_user: true, is_public_by_admin: true })
    ).toBe(true);
    expect(
      isReportAnalyzable({ is_public_by_user: true, is_public_by_admin: false })
    ).toBe(false);
    expect(
      isReportAnalyzable({ is_public_by_user: false, is_public_by_admin: true })
    ).toBe(false);
  });
});
