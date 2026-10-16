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
        data: "dummy",
      })
    ).toEqual({
      sessionId: "s1",
      publishStatus: "draft",
      publishLevel: "title_only",
      sourceTodo: false,
      dataKind: "dummy",
    });
  });

  it("空や知らない値は「すべて」", () => {
    expect(
      parseBillListFilter({
        session: "",
        publish: "deleted",
        level: "x",
        data: "y",
      })
    ).toEqual({
      sessionId: null,
      publishStatus: null,
      publishLevel: null,
      sourceTodo: false,
      dataKind: null,
    });
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
      is_dummy: false,
      source_needs_update: false,
    },
    {
      id: "2",
      session_id: "s1",
      publish_status: "published" as const,
      publish_level: "explained" as const,
      is_dummy: false,
      source_needs_update: true,
    },
    {
      id: "3",
      session_id: "s2",
      publish_status: "draft" as const,
      publish_level: "title_only" as const,
      is_dummy: true,
      source_needs_update: false,
    },
  ];

  it("条件をすべて満たす議案だけ残す", () => {
    const filter = parseBillListFilter({ session: "s1", publish: "draft" });
    expect(filterBills(bills, filter).map((b) => b.id)).toEqual(["1"]);
    expect(isFilterActive(filter)).toBe(true);
  });

  it("ダミーだけ・実データだけで絞る", () => {
    expect(
      filterBills(bills, parseBillListFilter({ data: "dummy" })).map(
        (b) => b.id
      )
    ).toEqual(["3"]);
    expect(
      filterBills(bills, parseBillListFilter({ data: "real" })).map((b) => b.id)
    ).toEqual(["1", "2"]);
  });

  it("出典の更新の余地あり（level=source_todo）は、フラグが立っている議案だけ", () => {
    const filter = parseBillListFilter({ level: "source_todo" });
    expect(filter.publishLevel).toBeNull();
    expect(filter.sourceTodo).toBe(true);
    expect(isFilterActive(filter)).toBe(true);
    expect(filterBills(bills, filter).map((b) => b.id)).toEqual(["2"]);
  });

  it("絞り込みが無ければすべて", () => {
    expect(filterBills(bills, parseBillListFilter({}))).toHaveLength(3);
  });
});
