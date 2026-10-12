import { describe, expect, it } from "vitest";
import type { BillResultFormValues, FactionOption } from "../types";
import {
  billResultInputFields,
  factionReferenceDate,
  parseBillResultInput,
  toBillResultFormValues,
} from "./bill-result-input";

const factions: FactionOption[] = [
  {
    id: "old",
    name: "旧会派",
    short_name: null,
    valid_from: "2019-05-01",
    valid_to: "2023-04-30",
  },
  {
    id: "a",
    name: "自由民主党",
    short_name: "自民",
    valid_from: "2023-05-01",
    valid_to: null,
  },
  {
    id: "b",
    name: "新政あいち",
    short_name: null,
    valid_from: "2023-05-01",
    valid_to: null,
  },
];

const empty: BillResultFormValues = {
  result: "",
  decided_on: "",
  yes_count: "",
  no_count: "",
  source_url: "",
  faction_votes: {},
};

const context = {
  granularity: "faction" as const,
  factions,
  today: "2026-10-12",
};

describe("billResultInputFields", () => {
  it("粒度ごとに出す欄を決める", () => {
    expect(billResultInputFields("result_only")).toEqual({
      counts: false,
      factions: false,
    });
    expect(billResultInputFields("unpublished")).toEqual({
      counts: false,
      factions: false,
    });
    expect(billResultInputFields("count")).toEqual({
      counts: true,
      factions: false,
    });
    expect(billResultInputFields("faction")).toEqual({
      counts: true,
      factions: true,
    });
    expect(billResultInputFields("member")).toEqual({
      counts: true,
      factions: true,
    });
  });
});

describe("factionReferenceDate", () => {
  it("議決日があればそれ、無ければ今日", () => {
    expect(factionReferenceDate("2026-09-25", "2026-10-12")).toBe("2026-09-25");
    expect(factionReferenceDate("", "2026-10-12")).toBe("2026-10-12");
  });
});

describe("toBillResultFormValues", () => {
  it("未保存なら空の入力欄", () => {
    expect(toBillResultFormValues(null)).toEqual(empty);
  });

  it("保存済みの値を文字列にする", () => {
    expect(
      toBillResultFormValues({
        result: "passed",
        decided_on: "2026-09-25",
        yes_count: 40,
        no_count: 0,
        source_url: null,
        faction_votes: [{ faction_id: "a", vote: "for" }],
      })
    ).toEqual({
      result: "passed",
      decided_on: "2026-09-25",
      yes_count: "40",
      no_count: "0",
      source_url: "",
      faction_votes: { a: "for" },
    });
  });
});

describe("parseBillResultInput", () => {
  it("結果が無ければエラー", () => {
    expect(parseBillResultInput(empty, context)).toEqual({
      ok: false,
      error: "結果を選んでください",
    });
  });

  it("入力どおりの値と会派ごとの賛否を返す（未入力の会派は除く）", () => {
    const parsed = parseBillResultInput(
      {
        result: "passed",
        decided_on: "2026-09-25",
        yes_count: "４０",
        no_count: "8",
        source_url: "https://example.jp/result.pdf",
        faction_votes: { a: "for", b: "" },
      },
      context
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        result: "passed",
        decided_on: "2026-09-25",
        yes_count: 40,
        no_count: 8,
        source_url: "https://example.jp/result.pdf",
      },
      factionVotes: [{ faction_id: "a", vote: "for" }],
    });
  });

  it("空欄は null にする", () => {
    const parsed = parseBillResultInput(
      { ...empty, result: "rejected" },
      context
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        result: "rejected",
        decided_on: null,
        yes_count: null,
        no_count: null,
        source_url: null,
      },
      factionVotes: [],
    });
  });

  it("票数が整数でなければエラー", () => {
    const parsed = parseBillResultInput(
      { ...empty, result: "passed", yes_count: "-1" },
      context
    );
    expect(parsed.ok).toBe(false);
  });

  it("出典が http(s) でなければエラー", () => {
    const parsed = parseBillResultInput(
      { ...empty, result: "passed", source_url: "javascript:alert(1)" },
      context
    );
    expect(parsed.ok).toBe(false);
  });

  it("議決日の形式が正しくなければエラー", () => {
    const parsed = parseBillResultInput(
      { ...empty, result: "passed", decided_on: "R8.9.25" },
      context
    );
    expect(parsed.ok).toBe(false);
  });

  it("議決日に有効でない会派の賛否はエラー", () => {
    const parsed = parseBillResultInput(
      {
        ...empty,
        result: "passed",
        decided_on: "2026-09-25",
        faction_votes: { old: "against" },
      },
      context
    );
    expect(parsed).toEqual({
      ok: false,
      error: "議決日（2026-09-25）の時点で有効でない会派の賛否が入っています",
    });
  });

  it("可否のみの議会では票数を使わず、会派ごとの賛否に触れない", () => {
    const parsed = parseBillResultInput(
      {
        ...empty,
        result: "passed",
        yes_count: "40",
        faction_votes: { a: "for" },
      },
      { ...context, granularity: "result_only" }
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: { yes_count: null, no_count: null },
      factionVotes: null,
    });
  });

  it("票数のみの議会では会派ごとの賛否に触れない", () => {
    const parsed = parseBillResultInput(
      { ...empty, result: "passed", yes_count: "40", no_count: "8" },
      { ...context, granularity: "count" }
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: { yes_count: 40, no_count: 8 },
      factionVotes: null,
    });
  });
});
