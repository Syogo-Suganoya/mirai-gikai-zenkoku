import { describe, expect, it } from "vitest";
import { JAPAN_MAP_SHAPES, JAPAN_MAP_VIEWBOX } from "./japan-map";

describe("JAPAN_MAP_SHAPES", () => {
  it("47都道府県すべての形がそろっている", () => {
    expect(JAPAN_MAP_SHAPES).toHaveLength(47);
    expect(new Set(JAPAN_MAP_SHAPES.map((s) => s.code)).size).toBe(47);
    expect(JAPAN_MAP_SHAPES.find((s) => s.code === "23")?.name).toBe("愛知県");
    expect(JAPAN_MAP_VIEWBOX).toMatch(/^\d/);
  });
});
