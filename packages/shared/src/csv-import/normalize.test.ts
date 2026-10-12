import { describe, expect, it } from "vitest";
import {
  inferBillCategory,
  normalizeAssemblyType,
  normalizeBillNumber,
  normalizeBillResult,
  normalizeBillStatus,
  normalizeCategory,
  normalizeDate,
  normalizeFactionVote,
  normalizeInteger,
  normalizeSessionType,
  normalizeUrl,
  statusForResult,
} from "./normalize";

describe("normalizeDate", () => {
  it.each([
    ["2026-09-01", "2026-09-01"],
    ["2026/9/1", "2026-09-01"],
    ["2026年9月1日", "2026-09-01"],
    ["R8.9.1", "2026-09-01"],
    ["r8/9/1", "2026-09-01"],
    ["令和8年9月1日", "2026-09-01"],
    ["令和元年5月1日", "2019-05-01"],
    ["H31.4.30", "2019-04-30"],
    ["２０２６－０９－０１", "2026-09-01"],
    ["令和８年９月１日", "2026-09-01"],
    [" 2026-09-01 ", "2026-09-01"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeDate(input)).toBe(expected);
  });

  it.each(["", "2026-02-30", "2026-13-01", "R8.9", "きのう", "20260901"])(
    "%s は読めない",
    (input) => {
      expect(normalizeDate(input)).toBeNull();
    }
  );
});

describe("normalizeBillNumber", () => {
  it("全角数字と空白のゆれを揃える", () => {
    expect(normalizeBillNumber("議案第５２号")).toBe("議案第52号");
    expect(normalizeBillNumber("議案第 52 号")).toBe("議案第52号");
    expect(normalizeBillNumber("　第157号　")).toBe("第157号");
  });
});

describe("normalizeBillResult", () => {
  it.each([
    ["可決", "passed"],
    ["原案可決", "passed"],
    ["可決及び認定", "passed"],
    ["認定", "passed"],
    ["同意", "passed"],
    ["原案適任", "passed"],
    ["承認", "passed"],
    ["知事の裁決書（案）を適当と認める", "passed"],
    ["知事の裁決書(案)を適当と認める", "passed"],
    ["修正可決", "amended"],
    ["附帯決議を付して修正可決", "amended"],
    ["否決", "rejected"],
    ["不認定", "rejected"],
    ["不同意", "rejected"],
    ["継続審査", "continued"],
    ["閉会中継続審査", "continued"],
    ["撤回", "withdrawn"],
    ["採択", "adopted"],
    ["一部採択", "adopted"],
    ["不採択", "not_adopted"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeBillResult(input)).toEqual({ kind: "result", value: expected });
  });

  it("報告受理は報告として返す", () => {
    expect(normalizeBillResult("報告受理")).toEqual({ kind: "report" });
  });

  it("分からない表記は null", () => {
    expect(normalizeBillResult("")).toBeNull();
    expect(normalizeBillResult("審議未了")).toBeNull();
  });
});

describe("normalizeFactionVote", () => {
  it("記号と言葉を賛否にする", () => {
    expect(normalizeFactionVote("○")).toBe("for");
    expect(normalizeFactionVote("〇")).toBe("for");
    expect(normalizeFactionVote("賛成")).toBe("for");
    expect(normalizeFactionVote("×")).toBe("against");
    expect(normalizeFactionVote("棄権")).toBe("abstain");
    expect(normalizeFactionVote("欠席")).toBe("absent");
    expect(normalizeFactionVote("分かれた")).toBe("split");
  });

  it("空欄とハイフンは記録なし、分からないものは null", () => {
    expect(normalizeFactionVote("")).toBeUndefined();
    expect(normalizeFactionVote("-")).toBeUndefined();
    expect(normalizeFactionVote("?")).toBeNull();
  });
});

describe("その他の正規化", () => {
  it("整数", () => {
    expect(normalizeInteger("４０")).toBe(40);
    expect(normalizeInteger("1,200")).toBe(1200);
    expect(normalizeInteger("")).toBeNull();
    expect(normalizeInteger("十")).toBeUndefined();
  });

  it("URL", () => {
    expect(normalizeUrl("https://example.jp/a")).toBe("https://example.jp/a");
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeUndefined();
    expect(normalizeUrl("example.jp")).toBeUndefined();
  });

  it("種類・状態・会期・議会の種類", () => {
    expect(normalizeCategory("請願・陳情")).toBe("petition");
    expect(normalizeCategory("陳情")).toBe("petition");
    expect(normalizeCategory("予算")).toBe("budget");
    expect(normalizeCategory("法律")).toBeNull();
    expect(normalizeBillStatus("委員会付託")).toBe("referred_to_committee");
    expect(normalizeBillStatus("成立")).toBeNull();
    expect(normalizeSessionType("定例議会")).toBe("regular");
    expect(normalizeSessionType("臨時会")).toBe("extraordinary");
    expect(normalizeAssemblyType("県")).toBe("prefecture");
    expect(normalizeAssemblyType("特別区")).toBe("special_ward");
  });
});

describe("inferBillCategory", () => {
  it("件名と結果から種類を推定する", () => {
    expect(inferBillCategory("令和7年度愛知県一般会計補正予算（第5号）")).toBe("budget");
    expect(inferBillCategory("愛知県手数料条例の一部改正について")).toBe("ordinance");
    expect(inferBillCategory("副知事の選任について", "同意")).toBe("personnel");
    expect(inferBillCategory("収用委員会の委員の選任について")).toBe("personnel");
    expect(inferBillCategory("工事請負契約の締結について", "可決")).toBe("contract");
    expect(inferBillCategory("財産の取得について", "可決")).toBe("contract");
    expect(inferBillCategory("県道の路線認定について", "可決")).toBe("other");
  });
});

describe("statusForResult", () => {
  it("継続審査・撤回はそれぞれの状態、それ以外は議決済み", () => {
    expect(statusForResult("passed")).toBe("decided");
    expect(statusForResult("rejected")).toBe("decided");
    expect(statusForResult("continued")).toBe("continued");
    expect(statusForResult("withdrawn")).toBe("withdrawn");
  });
});
