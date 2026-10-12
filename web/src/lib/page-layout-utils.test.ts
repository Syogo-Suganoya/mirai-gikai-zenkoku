import { describe, expect, it } from "vitest";

import {
  extractBillRouteFromPath,
  isInterviewPage,
  isInterviewSection,
  isMainPage,
} from "./page-layout-utils";

describe("isMainPage", () => {
  it("returns false for the top page (assembly select, no chat)", () => {
    expect(isMainPage("/")).toBe(false);
  });

  it("returns true for an assembly top page", () => {
    expect(isMainPage("/aichi-pref")).toBe(true);
  });

  it("returns true for a bill detail page", () => {
    expect(isMainPage("/aichi-pref/bills/abc-123")).toBe(true);
  });

  it("returns false for a bill sub-page", () => {
    expect(isMainPage("/aichi-pref/bills/abc-123/interview")).toBe(false);
  });

  it("returns false for static pages", () => {
    expect(isMainPage("/terms")).toBe(false);
    expect(isMainPage("/developers")).toBe(false);
    expect(isMainPage("/report/abc")).toBe(false);
  });

  it("returns true for the bills list page", () => {
    expect(isMainPage("/aichi-pref/bills")).toBe(true);
  });

  it("returns false for a session page", () => {
    expect(isMainPage("/aichi-pref/sessions/2026-02")).toBe(false);
  });
});

describe("isInterviewPage", () => {
  it("returns true for an interview chat page", () => {
    expect(isInterviewPage("/aichi-pref/bills/abc-123/interview/chat")).toBe(
      true
    );
  });

  it("returns false for an interview page without /chat", () => {
    expect(isInterviewPage("/aichi-pref/bills/abc-123/interview")).toBe(false);
  });

  it("returns false for a bill detail page", () => {
    expect(isInterviewPage("/aichi-pref/bills/abc-123")).toBe(false);
  });

  it("returns false for the top page", () => {
    expect(isInterviewPage("/")).toBe(false);
  });
});

describe("isInterviewSection", () => {
  it("returns true for the interview LP page", () => {
    expect(isInterviewSection("/aichi-pref/bills/abc-123/interview")).toBe(
      true
    );
  });

  it("returns true for the interview chat page", () => {
    expect(isInterviewSection("/aichi-pref/bills/abc-123/interview/chat")).toBe(
      true
    );
  });

  it("returns false for a bill detail page", () => {
    expect(isInterviewSection("/aichi-pref/bills/abc-123")).toBe(false);
  });

  it("returns false for the top page", () => {
    expect(isInterviewSection("/")).toBe(false);
  });

  it("returns false for unrelated paths", () => {
    expect(isInterviewSection("/about")).toBe(false);
  });
});

describe("extractBillRouteFromPath", () => {
  it("議案詳細のパスから議会と議案のキーを取り出す", () => {
    expect(extractBillRouteFromPath("/aichi-pref/bills/abc-123")).toEqual({
      assemblySlug: "aichi-pref",
      billKey: "abc-123",
    });
  });

  it("インタビューのパスからも取り出す", () => {
    expect(
      extractBillRouteFromPath("/aichi-pref/bills/abc-123/interview/chat")
    ).toEqual({ assemblySlug: "aichi-pref", billKey: "abc-123" });
  });

  it("プレビューのパスからも取り出す", () => {
    expect(
      extractBillRouteFromPath("/preview/aichi-pref/bills/abc-123/interview")
    ).toEqual({ assemblySlug: "aichi-pref", billKey: "abc-123" });
  });

  it("エンコードされたキーは戻す", () => {
    expect(
      extractBillRouteFromPath("/aichi-pref/bills/%E7%AC%AC1%E5%8F%B7")
    ).toEqual({ assemblySlug: "aichi-pref", billKey: "第1号" });
  });

  it("議案配下でないパスは null", () => {
    expect(extractBillRouteFromPath("/about")).toBeNull();
    expect(extractBillRouteFromPath("/")).toBeNull();
    expect(extractBillRouteFromPath("/aichi-pref/bills")).toBeNull();
  });
});
