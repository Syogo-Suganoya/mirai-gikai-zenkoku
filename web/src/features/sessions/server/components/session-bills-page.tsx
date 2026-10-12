import "server-only";

import { ExternalLink } from "lucide-react";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { AssemblyWithSettings } from "@/features/assemblies/shared/types";
import { getAssemblyBills } from "@/features/bills/server/loaders/get-assembly-bills";
import { routes } from "@/lib/routes";
import { SessionBillList } from "../../client/components/session-bill-list";
import { SESSION_TYPE_LABELS } from "../../shared/types";
import { formatSessionPeriod } from "../../shared/utils/format-session-period";
import { getSessionBySlug } from "../loaders/get-sessions";

type Props = {
  assembly: AssemblyWithSettings;
  sessionSlug: string;
};

/** 会期ごとの議案一覧（/[assembly]/sessions/[session]） */
export async function SessionBillsPage({ assembly, sessionSlug }: Props) {
  const session = await getSessionBySlug(assembly.id, sessionSlug);
  if (!session) {
    notFound();
  }

  const bills = await getAssemblyBills(assembly.id, { sessionId: session.id });

  return (
    <div className="bg-mirai-surface-muted">
      <Container className="pt-24 pb-8 md:pt-8">
        <div className="flex flex-col gap-8">
          <Breadcrumb
            items={[
              { label: assembly.name, href: routes.assemblyTop(assembly.slug) },
              { label: session.name },
            ]}
          />

          <div className="flex flex-col gap-1">
            <h1 className="flex items-center gap-4 text-[22px] font-bold leading-[1.48] text-black">
              {session.name}の議案
              <span>{bills.length}件</span>
            </h1>
            <p className="text-xs font-medium text-mirai-text">
              {SESSION_TYPE_LABELS[session.type]}・
              {formatSessionPeriod(session.start_date, session.end_date)}
            </p>
          </div>

          {bills.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              この会期の議案はまだ載っていません
            </p>
          ) : (
            <SessionBillList bills={bills} />
          )}

          {session.source_url && (
            <div className="flex items-center gap-1 text-[13px] font-medium text-mirai-text">
              {session.name}のすべての議案は
              <a
                href={session.source_url as Route}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                議会の公式サイトへ
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
