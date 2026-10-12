import { describe, expect, it } from "vitest";
import {
  filterBills,
  isFilterActive,
  parseBillListFilter,
} from "./bill-list-filter";

describe("parseBillListFilter", () => {
  it("URL の値を絞り込みにする", () => {
    expect(
      parseBillListFilter({
        session: "s1",
        publish: "draft",
        level: "title_only",
      })
    ).toEqual({
      sessionId: "s1",
      publishStatus: "draft",
      publishLevel: "title_only",
    });
  });

  it("空や知らない値は「すべて」", () => {
    expect(
      parseBillListFilter({ session: "", publish: "deleted", level: "x" })
    ).toEqual({ sessionId: null, publishStatus: null, publishLevel: null });
    expect(isFilterActive(parseBillListFilter({}))).toBe(false);
  });
});

describe("filterBills", () => {
  const bills = [
    {
      id: "1",
      session_id: "s1",
      publish_status: "draft" as const,
      publish_level: "title_only" as const,
    },
    {
      id: "2",
      session_id: "s1",
      publish_status: "published" as const,
      publish_level: "explained" as const,
    },
    {
      id: "3",
      session_id: "s2",
      publish_status: "draft" as const,
      publish_level: "title_only" as const,
    },
  ];

  it("条件をすべて満たす議案だけ残す", () => {
    const filter = parseBillListFilter({ session: "s1", publish: "draft" });
    expect(filterBills(bills, filter).map((b) => b.id)).toEqual(["1"]);
    expect(isFilterActive(filter)).toBe(true);
  });

  it("絞り込みが無ければすべて", () => {
    expect(filterBills(bills, parseBillListFilter({}))).toHaveLength(3);
  });
});
