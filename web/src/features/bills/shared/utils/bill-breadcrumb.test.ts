import { describe, expect, it } from "vitest";
import { billBreadcrumbItems } from "./bill-breadcrumb";

const assembly = { slug: "aichi-pref", name: "愛知県議会" };
const sessions = [
  {
    id: "s1",
    name: "令和7年6月定例議会",
    slug: null,
    session_key: "2025-06",
  },
  {
    id: "s2",
    name: "令和7年9月定例議会",
    slug: "r7-9",
    session_key: "2025-09",
  },
];

describe("billBreadcrumbItems", () => {
  it("議会 > 会期 > 議案番号（会期はスラッグが無ければ会期キーで開く）", () => {
    expect(
      billBreadcrumbItems(assembly, sessions, {
        session_id: "s1",
        bill_number: "第105号",
      })
    ).toEqual([
      { label: "愛知県議会", href: "/aichi-pref" },
      { label: "令和7年6月定例議会", href: "/aichi-pref/sessions/2025-06" },
      { label: "第105号" },
    ]);
  });

  it("会期にスラッグがあればスラッグで開く", () => {
    expect(
      billBreadcrumbItems(assembly, sessions, {
        session_id: "s2",
        bill_number: "第1号",
      })[1]
    ).toEqual({
      label: "令和7年9月定例議会",
      href: "/aichi-pref/sessions/r7-9",
    });
  });

  it("会期が見つからなければ会期を飛ばす", () => {
    expect(
      billBreadcrumbItems(assembly, sessions, {
        session_id: "unknown",
        bill_number: "第1号",
      })
    ).toEqual([
      { label: "愛知県議会", href: "/aichi-pref" },
      { label: "第1号" },
    ]);
  });
});
