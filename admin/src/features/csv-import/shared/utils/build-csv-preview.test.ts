import type { BillRecord } from "@mirai-gikai/shared/csv-import/types";
import { describe, expect, it } from "vitest";
import {
  buildPreviewRows,
  issuesToCsvRows,
  PREVIEW_ROW_LIMIT,
  recordLabel,
} from "./build-csv-preview";

const bill = (n: number, name: string | null = null): BillRecord => ({
  session_key: "2026-09",
  bill_number: `議案第${n}号`,
  official_name: `正式名称${n}`,
  name,
  category: "ordinance",
  submitter: null,
  submitted_date: null,
  committee_name: null,
  status: null,
  source_url: null,
  source_pages: null,
  tags: [],
});

describe("recordLabel", () => {
  it("議案は表示用タイトル、無ければ正式名称", () => {
    expect(recordLabel(bill(1, "わかりやすい名前"))).toBe("わかりやすい名前");
    expect(recordLabel(bill(1))).toBe("正式名称1");
  });
});

describe("buildPreviewRows", () => {
  it("新規と更新を目印・名前・変更つきにする", () => {
    const result = buildPreviewRows("bills", {
      inserts: [{ row: 2, record: bill(1) }],
      updates: [
        {
          row: 3,
          record: bill(2),
          changes: [{ field: "official_name", before: "旧", after: "新" }],
        },
      ],
      unchanged: [],
    });
    expect(result.inserts[0]).toMatchObject({
      row: 2,
      key: "2026-09 議案第1号",
      label: "正式名称1",
    });
    expect(result.updates[0].changes).toEqual([
      { field: "official_name", before: "旧", after: "新" },
    ]);
  });

  it("空の値は（空）と表示する", () => {
    const result = buildPreviewRows("bills", {
      inserts: [],
      updates: [
        {
          row: 2,
          record: bill(1),
          changes: [{ field: "submitter", before: null, after: "知事" }],
        },
      ],
      unchanged: [],
    });
    expect(result.updates[0].changes[0].before).toBe("（空）");
  });

  it("上限を超えた分は並べない", () => {
    const inserts = Array.from({ length: PREVIEW_ROW_LIMIT + 5 }, (_, i) => ({
      row: i + 2,
      record: bill(i + 1),
    }));
    const result = buildPreviewRows("bills", {
      inserts,
      updates: [],
      unchanged: [],
    });
    expect(result.inserts).toHaveLength(PREVIEW_ROW_LIMIT);
  });
});

describe("issuesToCsvRows", () => {
  it("見出しと行ごとのエラーにする", () => {
    expect(
      issuesToCsvRows([{ row: 3, column: "category", message: "種類が不明" }])
    ).toEqual([
      ["行", "列", "内容"],
      ["3", "category", "種類が不明"],
    ]);
  });
});
