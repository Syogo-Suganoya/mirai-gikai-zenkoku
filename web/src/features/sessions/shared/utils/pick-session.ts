import type { Session } from "../types";

type SessionLike = Pick<Session, "start_date" | "end_date" | "is_active">;

/**
 * 開会中の会期を選ぶ。管理画面で「開会中」にした会期（is_active）を優先し、
 * なければ今日を含む会期を返す。日付は YYYY-MM-DD の文字列で比べる。
 */
export function pickCurrentSession<T extends SessionLike>(
  sessions: readonly T[],
  today: string
): T | null {
  const active = sessions.find((s) => s.is_active);
  if (active) return active;
  return (
    [...sessions]
      .filter((s) => s.start_date <= today && today <= s.end_date)
      .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null
  );
}

/** 今日より前に閉会した直近の会期 */
export function pickLatestClosedSession<T extends SessionLike>(
  sessions: readonly T[],
  today: string
): T | null {
  return (
    [...sessions]
      .filter((s) => s.end_date < today)
      .sort((a, b) => b.end_date.localeCompare(a.end_date))[0] ?? null
  );
}

/**
 * 議会トップで中心に出す会期。開会中の会期、なければ直近に閉会した会期、
 * それもなければ（これから開会する会期だけのとき）いちばん新しい会期。
 */
export function pickFocusSession<T extends SessionLike>(
  sessions: readonly T[],
  today: string
): T | null {
  return (
    pickCurrentSession(sessions, today) ??
    pickLatestClosedSession(sessions, today) ??
    [...sessions].sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ??
    null
  );
}

/** Date を日本時間の YYYY-MM-DD にする（getJapanTime の結果を渡す） */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
