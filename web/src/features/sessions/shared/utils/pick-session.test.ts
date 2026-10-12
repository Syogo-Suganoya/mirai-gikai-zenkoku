import { describe, expect, it } from "vitest";
import {
  pickCurrentSession,
  pickFocusSession,
  pickLatestClosedSession,
  toDateString,
} from "./pick-session";

const s = (start_date: string, end_date: string, is_active = false) => ({
  start_date,
  end_date,
  is_active,
});

const sessions = [
  s("2026-02-18", "2026-03-25"),
  s("2026-06-15", "2026-07-02"),
  s("2026-09-20", "2026-10-15"),
];

describe("pickCurrentSession", () => {
  it("今日を含む会期を返す", () => {
    expect(pickCurrentSession(sessions, "2026-10-01")).toBe(sessions[2]);
    expect(pickCurrentSession(sessions, "2026-07-02")).toBe(sessions[1]);
    expect(pickCurrentSession(sessions, "2026-08-01")).toBeNull();
  });

  it("開会中に設定された会期を優先する", () => {
    const active = s("2025-12-01", "2025-12-18", true);
    expect(pickCurrentSession([...sessions, active], "2026-10-01")).toBe(
      active
    );
  });
});

describe("pickLatestClosedSession / pickFocusSession", () => {
  it("閉会中は直近に閉会した会期を返す", () => {
    expect(pickLatestClosedSession(sessions, "2026-08-01")).toBe(sessions[1]);
    expect(pickFocusSession(sessions, "2026-08-01")).toBe(sessions[1]);
  });

  it("これから開会する会期だけならいちばん新しい会期", () => {
    expect(pickFocusSession([sessions[2]], "2026-01-01")).toBe(sessions[2]);
    expect(pickFocusSession([], "2026-01-01")).toBeNull();
  });
});

describe("toDateString", () => {
  it("YYYY-MM-DD にする", () => {
    expect(toDateString(new Date(2026, 9, 2))).toBe("2026-10-02");
  });
});
