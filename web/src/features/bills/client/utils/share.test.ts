import { describe, expect, it } from "vitest";

import type { BillWithContent } from "../../shared/types";
import { createBillShareUrl, createShareMessage } from "./share";

describe("createBillShareUrl", () => {
  it("generates URL with origin, billId, and difficulty", () => {
    const url = createBillShareUrl(
      "https://example.com",
      "/aichi-pref/bills/bill-123",
      "normal"
    );
    expect(url).toBe(
      "https://example.com/aichi-pref/bills/bill-123?difficulty=normal"
    );
  });

  it("generates URL with hard difficulty", () => {
    const url = createBillShareUrl(
      "https://example.com",
      "/aichi-pref/bills/bill-456",
      "hard"
    );
    expect(url).toBe(
      "https://example.com/aichi-pref/bills/bill-456?difficulty=hard"
    );
  });

  it("handles origin without trailing slash", () => {
    const url = createBillShareUrl(
      "http://localhost:3000",
      "/a/bills/abc",
      "normal"
    );
    expect(url).toBe("http://localhost:3000/a/bills/abc?difficulty=normal");
  });
});

describe("createShareMessage", () => {
  const baseBill = {
    id: "bill-1",
    name: "正式議案名称",
    tags: [],
  } as unknown as BillWithContent;

  it("uses bill_content.title when available", () => {
    const bill: BillWithContent = {
      ...baseBill,
      bill_content: {
        title: "わかりやすいタイトル",
      } as BillWithContent["bill_content"],
    };
    expect(createShareMessage(bill)).toBe("わかりやすいタイトル #地方議会");
  });

  it("falls back to bill.name when bill_content is undefined", () => {
    const bill: BillWithContent = {
      ...baseBill,
      bill_content: undefined,
    };
    expect(createShareMessage(bill)).toBe("正式議案名称 #地方議会");
  });

  it("falls back to bill.name when bill_content.title is null", () => {
    const bill: BillWithContent = {
      ...baseBill,
      bill_content: {
        title: null,
      } as unknown as BillWithContent["bill_content"],
    };
    expect(createShareMessage(bill)).toBe("正式議案名称 #地方議会");
  });

  it("ダミーの議案は【ダミー】を付ける", () => {
    const bill: BillWithContent = {
      ...baseBill,
      is_dummy: true,
      bill_content: {
        title: "観光案内を整える補正予算（ダミー）",
      } as BillWithContent["bill_content"],
    };
    expect(createShareMessage(bill)).toBe(
      "【ダミー】観光案内を整える補正予算（ダミー） #地方議会"
    );
  });

  it("includes hashtag #地方議会", () => {
    const message = createShareMessage(baseBill);
    expect(message).toContain("#地方議会");
  });
});
