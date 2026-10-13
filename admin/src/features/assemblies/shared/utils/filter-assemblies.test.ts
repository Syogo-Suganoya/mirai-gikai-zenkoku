import { describe, expect, it } from "vitest";
import type { AssemblyListItem } from "../types";
import { countAssembliesByKind, filterAssemblies } from "./filter-assemblies";

function item(
  overrides: Pick<
    AssemblyListItem,
    "slug" | "name" | "type" | "prefecture_code"
  >
): AssemblyListItem {
  return {
    id: overrides.slug,
    status: "public",
    billCount: 0,
    publishedBillCount: 0,
    dummyBillCount: 0,
    ...overrides,
  };
}

const assemblies = [
  item({
    slug: "hokkaido-pref",
    name: "北海道議会",
    type: "prefecture",
    prefecture_code: "01",
  }),
  item({
    slug: "aichi-pref",
    name: "愛知県議会",
    type: "prefecture",
    prefecture_code: "23",
  }),
  item({
    slug: "nagoya-city",
    name: "名古屋市議会",
    type: "city",
    prefecture_code: "23",
  }),
  item({
    slug: "chiyoda-ward",
    name: "千代田区議会",
    type: "special_ward",
    prefecture_code: "13",
  }),
];

const slugs = (items: AssemblyListItem[]) => items.map((a) => a.slug);

describe("filterAssemblies", () => {
  it("区分で絞り、並び順は保つ", () => {
    expect(
      slugs(filterAssemblies(assemblies, { kind: "prefecture", query: "" }))
    ).toEqual(["hokkaido-pref", "aichi-pref"]);
    expect(
      slugs(filterAssemblies(assemblies, { kind: "town", query: "" }))
    ).toEqual(["chiyoda-ward"]);
  });

  it("都道府県名で探せる（その県の市も当たる）", () => {
    expect(
      slugs(filterAssemblies(assemblies, { kind: "city", query: "愛知" }))
    ).toEqual(["nagoya-city"]);
    expect(
      slugs(
        filterAssemblies(assemblies, { kind: "prefecture", query: "愛知県" })
      )
    ).toEqual(["aichi-pref"]);
  });

  it("議会名・スラッグでも探せる", () => {
    expect(
      slugs(filterAssemblies(assemblies, { kind: "city", query: "名古屋" }))
    ).toEqual(["nagoya-city"]);
    expect(
      slugs(
        filterAssemblies(assemblies, {
          kind: "prefecture",
          query: " HOKKAIDO ",
        })
      )
    ).toEqual(["hokkaido-pref"]);
  });

  it("当たらなければ空", () => {
    expect(
      filterAssemblies(assemblies, { kind: "prefecture", query: "大阪" })
    ).toEqual([]);
  });
});

describe("countAssembliesByKind", () => {
  it("区分ごとの件数", () => {
    expect(countAssembliesByKind(assemblies)).toEqual({
      prefecture: 2,
      city: 1,
      town: 1,
    });
  });
});
