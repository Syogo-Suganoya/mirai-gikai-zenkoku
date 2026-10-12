import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { SESSION_TYPE_LABELS } from "@/features/sessions/shared/types";
import { formatSessionPeriod } from "@/features/sessions/shared/utils/format-session-period";
import { routes } from "@/lib/routes";
import type { SessionWithBillCount } from "../loaders/get-sessions-with-bill-count";

interface PastSessionListProps {
  assemblySlug: string;
  sessions: SessionWithBillCount[];
  title?: string;
}

/** 会期の一覧（会期ごとの議案ページへのリンク） */
export function PastSessionList({
  assemblySlug,
  sessions,
  title = "過去の会期一覧",
}: PastSessionListProps) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[22px] font-bold leading-[1.48] text-black">
          {title}
        </h3>
        <p className="text-xs font-medium text-mirai-text">
          定例会・臨時会ごとの議案をまとめて見られます
        </p>
      </div>

      <ul className="flex flex-col divide-y-[0.5px] divide-mirai-border overflow-hidden rounded-2xl border-[0.5px] border-mirai-text-placeholder bg-white">
        {sessions.map(({ session, billCount }) => (
          <li key={session.id}>
            <Link
              href={
                routes.sessionBills(
                  assemblySlug,
                  session.slug ?? session.session_key
                ) as Route
              }
              className="flex items-center gap-3 px-4 py-3.5 text-mirai-text transition-colors hover:bg-muted/50"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[15px] font-bold leading-normal">
                  {session.name}
                </span>
                <span className="text-xs font-medium text-mirai-text-muted">
                  {SESSION_TYPE_LABELS[session.type]}・
                  {formatSessionPeriod(session.start_date, session.end_date)}
                </span>
              </div>
              <span className="shrink-0 text-[13px] font-bold text-mirai-text-secondary">
                {billCount}件
              </span>
              <ChevronRight className="h-[18px] w-[18px] shrink-0 text-gray-600" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
