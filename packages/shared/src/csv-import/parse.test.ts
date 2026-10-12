import { describe, expect, it } from "vitest";
import { decodeCsv, detectEncoding } from "./encoding";
import { parseCsv } from "./parse";
import { buildTemplateCsv } from "./templates";

describe("parseCsv", () => {
  it("日本語の見出しを列名に対応づける", () => {
    const text = "会期キー,会期名,種類,開会日,閉会日\n2026-09,令和8年9月定例会,定例会,2026-09-01,2026-09-25\n";
    const result = parseCsv(text, "sessions");
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        row: 2,
        values: {
          session_key: "2026-09",
          name: "令和8年9月定例会",
          type: "定例会",
          start_date: "2026-09-01",
          end_date: "2026-09-25",
        },
        extra: {},
      },
    ]);
  });

  it("英語の見出し・順番の入れ替え・引用符付きのセルを受け付ける", () => {
    const text = 'end_date,session_key,name,type,start_date\r\n2026-09-25,2026-09,"令和8年9月定例会, 補足",regular,2026-09-01\r\n';
    const result = parseCsv(text, "sessions");
    expect(result.errors).toEqual([]);
    expect(result.rows[0].values.name).toBe("令和8年9月定例会, 補足");
    expect(result.rows[0].values.end_date).toBe("2026-09-25");
  });

  it("必須の列がなければエラー", () => {
    const result = parseCsv("会期キー,会期名\n2026-09,a\n", "sessions");
    expect(result.errors.map((e) => e.column)).toEqual(["種類", "開会日", "閉会日"]);
  });

  it("知らない見出しはエラー（議決結果以外）", () => {
    const result = parseCsv("会派名,有効開始日,色\nA,2023-05-01,赤\n", "factions");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("色");
  });

  it("議決結果では知らない見出しを会派の列として扱う", () => {
    const text = "会期キー,議案番号,結果,◯◯の会,△△クラブ\n2026-09,第1号,可決,○,×\n";
    const result = parseCsv(text, "results");
    expect(result.errors).toEqual([]);
    expect(result.extraColumns).toEqual(["◯◯の会", "△△クラブ"]);
    expect(result.rows[0].extra).toEqual({ "◯◯の会": "○", "△△クラブ": "×" });
  });

  it("空の行は捨てる", () => {
    const text = "会期キー,会期名,種類,開会日,閉会日\n,,,,\n2026-09,a,定例会,2026-09-01,2026-09-02\n\n";
    expect(parseCsv(text, "sessions").rows.map((r) => r.row)).toEqual([3]);
  });

  it("テンプレートはそのまま読める", () => {
    const result = parseCsv(buildTemplateCsv("bills"), "bills");
    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
  });
});

describe("decodeCsv", () => {
  it("UTF-8（BOM あり・なし）を読む", () => {
    const utf8 = new TextEncoder().encode("会期キー\n");
    expect(detectEncoding(utf8)).toBe("utf-8");
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8]);
    expect(decodeCsv(withBom)).toEqual({ text: "会期キー\n", encoding: "utf-8" });
  });

  it("Shift_JIS を読む", () => {
    // 「会期」の Shift_JIS
    const sjis = new Uint8Array([0x89, 0xef, 0x8a, 0xfa, 0x0a]);
    expect(decodeCsv(sjis)).toEqual({ text: "会期\n", encoding: "shift_jis" });
  });
});
