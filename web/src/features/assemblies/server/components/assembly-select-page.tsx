import "server-only";

import { prefectureAssemblyByCode } from "@mirai-gikai/shared/prefectures";
import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { SITE_NAME } from "@/config/site";
import { DummyBadge } from "@/features/bills/client/components/bill-list/dummy-badge";
import { routes } from "@/lib/routes";
import { JapanMapSelector } from "../../client/components/japan-map-selector";
import { getAssemblySummaries } from "../loaders/get-assembly-summaries";

/**
 * 議会選択（/）。開会中の議会と、日本地図から都道府県議会を開く入口。
 * この画面は都道府県議会だけを扱う（市区町村議会は今のフェーズでは出さない）。
 */
export async function AssemblySelectPage() {
  const assemblies = (await getAssemblySummaries()).filter(
    (a) => a.type === "prefecture"
  );
  const inSession = assemblies.filter((a) => a.activeSessionName !== null);
  const assemblyByPrefecture = prefectureAssemblyByCode(assemblies);

  return (
    <Container className="pt-24 pb-10 md:pt-8">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold leading-normal text-mirai-text">
            {SITE_NAME}
          </h1>
          <p className="text-sm leading-[1.8] text-mirai-text-secondary">
            全国の地方議会で審議されている議案を、わかりやすく紹介します。
            地図か下のボタンから都道府県を選ぶと、その議会のページを開きます。
          </p>
        </div>

        {inSession.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-[20px] font-bold text-mirai-text">
              いま開会中の議会
            </h2>
            <ul className="flex flex-col divide-y divide-mirai-border overflow-hidden rounded-2xl border border-mirai-border bg-white">
              {inSession.map((assembly) => (
                <li key={assembly.id}>
                  <Link
                    href={routes.assemblyTop(assembly.slug) as Route}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2 text-[15px] font-bold">
                        {assembly.name}
                        {assembly.dummyOnly && <DummyBadge />}
                      </span>
                      <span className="text-xs text-mirai-text-muted">
                        {assembly.activeSessionName}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-mirai-text-muted"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-[20px] font-bold text-mirai-text">
            都道府県から探す
          </h2>
          <JapanMapSelector assemblyByPrefecture={assemblyByPrefecture} />
        </section>
      </div>
    </Container>
  );
}
