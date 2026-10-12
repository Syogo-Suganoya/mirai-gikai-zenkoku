import { describe, expect, it } from "vitest";
import { encodeCursor } from "./cursor";
import { parseBillsQuery, parseDifficultyQuery } from "./parse-bills-query";
import { DEFAULT_LIMIT } from "./parse-pagination-query";

describe("parseBillsQuery", () => {
  it("パラメータ未指定時は既定値を返す", () => {
    const result = parseBillsQuery(new URLSearchParams());
    expect(result).toEqual({
      ok: true,
      limit: DEFAULT_LIMIT,
      cursor: null,
      difficulty: "normal",
      assemblySlug: null,
    });
  });

  it("limit / cursor / difficulty / assembly をすべて解析する", () => {
    const cursor = {
      createdAt: "2026-01-01T00:00:00+00:00",
      id: "123e4567-e89b-12d3-a456-426614174000",
    };
    const params = new URLSearchParams({
      limit: "5",
      cursor: encodeCursor(cursor),
      difficulty: "hard",
      assembly: "aichi-pref",
    });
    expect(parseBillsQuery(params)).toEqual({
      ok: true,
      limit: 5,
      cursor,
      difficulty: "hard",
      assemblySlug: "aichi-pref",
    });
  });

  it("limit が不正な場合はエラーを返す", () => {
    const result = parseBillsQuery(new URLSearchParams({ limit: "0" }));
    expect(result.ok).toBe(false);
  });

  it("cursor が不正な場合はエラーを返す", () => {
    const result = parseBillsQuery(new URLSearchParams({ cursor: "invalid" }));
    expect(result.ok).toBe(false);
  });

  it("difficulty が不正な場合はエラーを返す", () => {
    const result = parseBillsQuery(
      new URLSearchParams({ difficulty: "expert" })
    );
    expect(result.ok).toBe(false);
  });

  it("assembly がスラッグの形でない場合はエラーを返す", () => {
    for (const assembly of ["Aichi", "aichi pref", "-aichi", "愛知"]) {
      const result = parseBillsQuery(new URLSearchParams({ assembly }));
      expect(result.ok).toBe(false);
    }
  });

  it("assembly が空文字なら全議会として扱う", () => {
    const result = parseBillsQuery(new URLSearchParams({ assembly: "" }));
    expect(result).toMatchObject({ ok: true, assemblySlug: null });
  });
});

describe("parseDifficultyQuery", () => {
  it("未指定は既定値 normal を返す", () => {
    expect(parseDifficultyQuery(new URLSearchParams())).toEqual({
      ok: true,
      difficulty: "normal",
    });
  });

  it("有効な値はそのまま返す", () => {
    expect(
      parseDifficultyQuery(new URLSearchParams({ difficulty: "hard" }))
    ).toEqual({ ok: true, difficulty: "hard" });
  });

  it("不正な値はエラーを返す", () => {
    const result = parseDifficultyQuery(
      new URLSearchParams({ difficulty: "expert" })
    );
    expect(result.ok).toBe(false);
  });
});
