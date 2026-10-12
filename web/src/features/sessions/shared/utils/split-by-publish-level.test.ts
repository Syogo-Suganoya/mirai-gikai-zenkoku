import { describe, expect, it } from "vitest";
import { splitByPublishLevel } from "./split-by-publish-level";

describe("splitByPublishLevel", () => {
  it("解説付きと件名のみに分け、それぞれ元の順を保つ", () => {
    const bills = [
      { id: "a", publish_level: "title_only" as const },
      { id: "b", publish_level: "explained" as const },
      { id: "c", publish_level: "title_only" as const },
      { id: "d", publish_level: "explained" as const },
    ];
    const { explained, titleOnly } = splitByPublishLevel(bills);
    expect(explained.map((b) => b.id)).toEqual(["b", "d"]);
    expect(titleOnly.map((b) => b.id)).toEqual(["a", "c"]);
  });

  it("空なら両方空", () => {
    expect(splitByPublishLevel([])).toEqual({ explained: [], titleOnly: [] });
  });
});
