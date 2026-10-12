import { describe, expect, it } from "vitest";
import {
  countByCategory,
  isBillCategory,
  toBillCategoryCounts,
} from "./bill-category";

describe("isBillCategory", () => {
  it("種類の値なら true", () => {
    expect(isBillCategory("budget")).toBe(true);
    expect(isBillCategory("ordinance")).toBe(true);
  });

  it("それ以外は false", () => {
    expect(isBillCategory("law")).toBe(false);
    expect(isBillCategory(undefined)).toBe(false);
  });
});

describe("countByCategory", () => {
  it("種類ごとに数える", () => {
    expect(
      countByCategory([
        { category: "budget" },
        { category: "budget" },
        { category: "ordinance" },
      ])
    ).toEqual({ budget: 2, ordinance: 1 });
  });
});

describe("toBillCategoryCounts", () => {
  it("決まった順に並べ、0件の種類は出さない", () => {
    expect(toBillCategoryCounts({ ordinance: 3, budget: 2, other: 0 })).toEqual(
      [
        { category: "budget", label: "予算", count: 2 },
        { category: "ordinance", label: "条例", count: 3 },
      ]
    );
  });
});
