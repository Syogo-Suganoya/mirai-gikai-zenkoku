import type { Metadata } from "next";
import { requireAssembly } from "@/features/assemblies/server/loaders/get-assembly";
import { SessionBillsPage } from "@/features/sessions/server/components/session-bills-page";
import { getSessionBySlug } from "@/features/sessions/server/loaders/get-sessions";

type Props = {
  params: Promise<{ assembly: string; session: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assembly: assemblySlug, session: sessionSlug } = await params;
  const assembly = await requireAssembly(assemblySlug);
  const session = await getSessionBySlug(assembly.id, sessionSlug);
  if (!session) {
    return { title: "会期が見つかりません" };
  }

  return {
    title: `${session.name}の議案一覧 - ${assembly.name}`,
    description: `${assembly.name} ${session.name}（${session.start_date}〜${session.end_date}）に提出された議案の一覧です。`,
  };
}

export default async function SessionPage({ params }: Props) {
  const { assembly: assemblySlug, session } = await params;
  const assembly = await requireAssembly(assemblySlug);
  return <SessionBillsPage assembly={assembly} sessionSlug={session} />;
}
