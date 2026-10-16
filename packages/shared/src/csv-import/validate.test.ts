import { describe, expect, it } from "vitest";
import { diffRows } from "./diff";
import { parseCsv } from "./parse";
import type { CsvImportKind } from "./types";
import { validateRows, type ValidationContext } from "./validate";

function validate<K extends CsvImportKind>(
  kind: K,
  text: string,
  context: ValidationContext = {}
) {
  const parsed = parseCsv(text, kind);
  expect(parsed.errors).toEqual([]);
  return validateRows(kind, parsed.rows, context);
}

describe("validateRows: 議会マスタ", () => {
  it("正しい行を正規化する", () => {
    const result = validate(
      "assemblies",
      "団体コード,議会名,種類,都道府県コード,スラッグ\n４０１３０７,福岡市議会,市,40,fukuoka-city\n"
    );
    expect(result.errors).toEqual([]);
    expect(result.records[0].record).toEqual({
      local_gov_code: "401307",
      name: "福岡市議会",
      type: "city",
      prefecture_code: "40",
      slug: "fukuoka-city",
      official_url: null,
    });
  });

  it("団体コードと都道府県の不一致・スラッグの重複を見つける", () => {
    const result = validate(
      "assemblies",
      "団体コード,議会名,種類,都道府県コード,スラッグ\n401307,福岡市議会,市,41,aichi-pref\n",
      { assemblySlugs: new Map([["aichi-pref", "230006"]]) }
    );
    expect(result.records).toEqual([]);
    expect(result.errors.map((e) => e.column)).toEqual(["団体コード", "スラッグ"]);
  });

  it("サイトの固定のページと同じスラッグは使えない", () => {
    const result = validate(
      "assemblies",
      "団体コード,議会名,種類,都道府県コード,スラッグ\n401307,福岡市議会,市,40,cities\n"
    );
    expect(result.records).toEqual([]);
    expect(result.errors[0].message).toContain("サイトのページの名前と重なる");
  });
});

describe("validateRows: 議案", () => {
  const header = "会期キー,議案番号,正式名称,種類,状態,タグ\n";
  const context = {
    sessionKeys: new Set(["2026-09"]),
    tagLabels: new Set(["子育て", "税"]),
  };

  it("必須・会期・タグを確かめる", () => {
    const result = validate(
      "bills",
      `${header}2026-09,議案第５２号,手数料条例の一部改正,条例,,子育て;税\n2026-12,第1号,予算,予算,,\n2026-09,第2号,,条例,成立,猫\n`,
      context
    );
    expect(result.records.map((r) => r.record.bill_number)).toEqual(["議案第52号"]);
    expect(result.records[0].record.tags).toEqual(["子育て", "税"]);
    expect(result.records[0].record.status).toBeNull();
    expect(result.errors.map((e) => [e.row, e.column])).toEqual([
      [3, "会期キー"],
      [4, "正式名称"],
      [4, "状態"],
      [4, "タグ"],
    ]);
  });

  it("同じ目印の行は2つ目をエラーにする", () => {
    const result = validate(
      "bills",
      `${header}2026-09,第1号,a,条例,,\n2026-09,第１号,b,条例,,\n`,
      context
    );
    expect(result.records).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ row: 3 });
    expect(result.errors[0].message).toContain("2 行目と同じ");
  });

  it("原文 URL と議会のサイトの資料 URL を別々に読む（省いた列は空）", () => {
    const result = validate(
      "bills",
      "会期キー,議案番号,正式名称,種類,原文 URL,議会のサイトの資料 URL\n2026-09,第1号,a,条例,,https://example.jp/list.pdf\n2026-09,第2号,b,条例,https://example.jp/gian.pdf,\n",
      context
    );
    expect(result.errors).toEqual([]);
    expect(
      result.records.map((r) => [r.record.source_url, r.record.materials_url])
    ).toEqual([
      [null, "https://example.jp/list.pdf"],
      ["https://example.jp/gian.pdf", null],
    ]);
  });
});

describe("validateRows: 議決結果", () => {
  const header = "会期キー,議案番号,結果,議決日,賛成数,反対数,◯◯の会,△△\n";
  const base: ValidationContext = {
    bills: new Map([
      ["2026-09|第1号", { category: "ordinance" as const }],
      ["2026-09|報告第1号", { category: "report" as const }],
    ]),
    factions: [
      { name: "◯◯の会", short_name: null, valid_from: "2023-05-01", valid_to: null },
      { name: "△△クラブ", short_name: "△△", valid_from: "2023-05-01", valid_to: null },
    ],
  };

  it("会派別の議会では会派の列を名前・略称で突き合わせる", () => {
    const result = validate(
      "results",
      `${header}2026-09,第1号,原案可決,R8.9.25,40,8,○,×\n`,
      { ...base, voteGranularity: "faction" }
    );
    expect(result.errors).toEqual([]);
    expect(result.records[0].record).toEqual({
      session_key: "2026-09",
      bill_number: "第1号",
      result: "passed",
      decided_on: "2026-09-25",
      yes_count: 40,
      no_count: 8,
      source_url: null,
      faction_votes: [
        { faction_name: "◯◯の会", vote: "for" },
        { faction_name: "△△クラブ", vote: "against" },
      ],
    });
  });

  it("粒度が会派別より粗い議会では会派の列を無視して警告する", () => {
    const result = validate(
      "results",
      `${header}2026-09,第1号,可決,,,,○,×\n`,
      { ...base, voteGranularity: "result_only" }
    );
    expect(result.errors).toEqual([]);
    expect(result.records[0].record.faction_votes).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });

  it("報告・未登録の議案・分からない会派を扱う", () => {
    const result = validate(
      "results",
      "会期キー,議案番号,結果,議決日,新会派\n2026-09,報告第1号,報告受理,,\n2026-09,第9号,可決,,\n2026-09,第1号,可決,2026-09-25,○\n",
      { ...base, voteGranularity: "faction" }
    );
    expect(result.records).toEqual([]);
    expect(result.warnings.map((w) => w.row)).toEqual([2]);
    expect(result.errors.map((e) => e.row)).toEqual([3, 4]);
  });
});

describe("diffRows", () => {
  it("新規・更新・変化なしに分け、空欄は変更に数えない", () => {
    const validated = validate(
      "sessions",
      "会期キー,会期名,種類,開会日,閉会日,出典\n2026-09,令和8年9月定例会,定例会,2026-09-01,2026-09-25,\n2026-12,令和8年12月定例会,定例会,2026-12-01,2026-12-20,\n2027-02,令和9年2月定例会,定例会,2027-02-15,2027-03-20,\n"
    );
    const existing = new Map([
      [
        "2026-09",
        {
          session_key: "2026-09",
          name: "令和8年9月定例会",
          type: "regular" as const,
          start_date: "2026-09-01",
          end_date: "2026-09-25",
          source_url: "https://example.jp",
        },
      ],
      [
        "2026-12",
        {
          session_key: "2026-12",
          name: "令和8年12月定例会",
          type: "regular" as const,
          start_date: "2026-12-01",
          end_date: "2026-12-18",
          source_url: null,
        },
      ],
    ]);
    const diff = diffRows("sessions", validated.records, existing);
    expect(diff.unchanged.map((r) => r.record.session_key)).toEqual(["2026-09"]);
    expect(diff.updates.map((r) => r.changes)).toEqual([
      [{ field: "end_date", before: "2026-12-18", after: "2026-12-20" }],
    ]);
    expect(diff.inserts.map((r) => r.record.session_key)).toEqual(["2027-02"]);
  });
});
