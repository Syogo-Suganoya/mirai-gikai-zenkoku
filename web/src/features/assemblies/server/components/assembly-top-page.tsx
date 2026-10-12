import "server-only";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { ComingSoonSection } from "@/components/top/coming-soon-section";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDisclaimer } from "@/features/bills/client/components/bill-detail/bill-disclaimer";
import { BillSearchOverlay } from "@/features/bills/client/components/bill-search-overlay";
import { BillCategoryTabs } from "@/features/bills/server/components/bill-category-tabs";
import { CategoryTabs } from "@/features/bills/server/components/category-tabs";
import { FeaturedBillSection } from "@/features/bills/server/components/featured-bill-section";
import { InterviewOpenBillSection } from "@/features/bills/server/components/interview-open-bill-section";
import { PastSessionList } from "@/features/bills/server/components/past-session-list";
import { getAssemblyBills } from "@/features/bills/server/loaders/get-assembly-bills";
import { getBillCategoryCounts } from "@/features/bills/server/loaders/get-bill-category-counts";
import { getBillsByFeaturedTags } from "@/features/bills/server/loaders/get-bills-by-featured-tags";
import { getComingSoonBills } from "@/features/bills/server/loaders/get-coming-soon-bills";
import { getFeaturedBills } from "@/features/bills/server/loaders/get-featured-bills";
import { getFeaturedTags } from "@/features/bills/server/loaders/get-featured-tags";
import { getInterviewOpenBills } from "@/features/bills/server/loaders/get-interview-open-bills";
import { getSessionsWithBillCount } from "@/features/bills/server/loaders/get-sessions-with-bill-count";
import { getSuggestableBills } from "@/features/bills/server/loaders/get-suggestable-bills";
import { chatBillName } from "@/features/bills/shared/utils/chat-bill-name";
import { pickHomeSections } from "@/features/bills/shared/utils/pick-home-sections";
import { countTagChipItems } from "@/features/bills/shared/utils/tag-chip-items";
import { HomeChatClient } from "@/features/chat/client/components/home-chat-client";
import { CurrentSessionCard } from "@/features/sessions/client/components/current-session-card";
import { SessionBillList } from "@/features/sessions/client/components/session-bill-list";
import { getSessionsByAssembly } from "@/features/sessions/server/loaders/get-sessions";
import {
  pickCurrentSession,
  pickFocusSession,
  pickLatestClosedSession,
  toDateString,
} from "@/features/sessions/shared/utils/pick-session";
import { routes } from "@/lib/routes";
import { getJapanTime } from "@/lib/utils/date";
import type { AssemblyWithSettings } from "../../shared/types";

/** カテゴリタブの「注目」から飛ばす先。 */
const FEATURED_ANCHOR = "featured";

/**
 * 議会トップ（/[assembly]）。
 * 開会中の会期（なければ直近の会期）と、その議案の一覧を中心に出す。
 * 解説付きの議案を上に、件名のみの議案はまとめて下に出す（v2 3章）。
 */
export async function AssemblyTopPage({
  assembly,
}: {
  assembly: AssemblyWithSettings;
}) {
  const { settings } = assembly;
  const japanTime = getJapanTime();
  const today = toDateString(japanTime);

  const sessions = await getSessionsByAssembly(assembly.id);
  const currentSession = pickCurrentSession(sessions, today);
  const latestClosedSession = pickLatestClosedSession(sessions, today);
  const focusSession = pickFocusSession(sessions, today);
  const inSession = currentSession !== null;

  const [
    focusBills,
    featuredBills,
    interviewOpenBills,
    comingSoonBills,
    billsByTag,
    pastSessions,
    currentDifficulty,
    suggestableBills,
    featuredTags,
    categoryCounts,
  ] = await Promise.all([
    focusSession
      ? getAssemblyBills(assembly.id, { sessionId: focusSession.id })
      : Promise.resolve([]),
    inSession
      ? getFeaturedBills(assembly.id, currentSession.id)
      : Promise.resolve([]),
    settings.show_interview
      ? getInterviewOpenBills(assembly.id)
      : Promise.resolve([]),
    getComingSoonBills(assembly.id, focusSession?.id ?? null),
    getBillsByFeaturedTags(assembly.id, focusSession?.id ?? null),
    getSessionsWithBillCount(assembly.id, focusSession?.id),
    getDifficultyLevel(),
    getSuggestableBills(assembly.id),
    getFeaturedTags(),
    getBillCategoryCounts(assembly.id),
  ]);

  const { shownBills, featuredBillIds } = pickHomeSections({
    billsByTag,
    featuredBills,
    interviewOpenBills,
    inSession,
  });

  // モーダルの件数は全会期の公開議案から数える。チップの飛び先が議案一覧で、
  // あちらも全会期を数えるため、押す前と後で数字が変わらない。
  const searchTagChips = countTagChipItems(featuredTags, suggestableBills);

  // チャットの文脈は画面に出ている議案（注目・受付中・会期の解説付き議案）
  const chatBills = [
    ...shownBills,
    ...focusBills.filter(
      (bill) =>
        bill.publish_level === "explained" &&
        !shownBills.some((shown) => shown.id === bill.id)
    ),
  ];

  return (
    <>
      {/* ヘッダーは fixed で main-layout の上余白は md 以上にしか効かないため、
          モバイルではここで余白を確保する（パンくずを持つページと同じ規約） */}
      <Container className="pt-24 md:pt-5">
        <Link
          href={routes.home() as Route}
          className="inline-flex items-center gap-1 text-[13px] font-bold text-mirai-text-secondary hover:text-mirai-text hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          日本地図に戻る
        </Link>
      </Container>

      <CurrentSessionCard
        assemblyName={assembly.name}
        session={currentSession}
        closedSession={latestClosedSession}
        now={japanTime}
      />

      <Container>
        <div className="pt-4">
          <BillCategoryTabs
            assemblySlug={assembly.slug}
            counts={categoryCounts}
          />
        </div>
        <div className="pt-3">
          <CategoryTabs
            assemblySlug={assembly.slug}
            billsByTag={billsByTag}
            featuredAnchor={
              inSession && featuredBills.length > 0
                ? FEATURED_ANCHOR
                : undefined
            }
          />
        </div>
        {/* 検索の入口。キーワードとテーマの両方をモーダルに並べる */}
        <div className="flex justify-end pt-2">
          <BillSearchOverlay
            assemblySlug={assembly.slug}
            tags={searchTagChips}
            bills={suggestableBills}
          />
        </div>
      </Container>

      <Container>
        <div className="py-10">
          <main className="flex flex-col gap-16">
            {/* AIインタビュー受付中。会期では絞らない（閉会中でも受付中なら案内する） */}
            <InterviewOpenBillSection bills={interviewOpenBills} />

            {/* 注目の議案は会期中だけ出す */}
            {inSession && (
              <section id={FEATURED_ANCHOR}>
                <FeaturedBillSection bills={featuredBills} />
              </section>
            )}

            {/* 中心に出す会期の議案 */}
            {focusSession && (
              <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h2 className="flex items-center gap-4 text-[22px] font-bold leading-[1.48] text-mirai-text">
                    {focusSession.name}の議案
                    <span className="text-[20px]">{focusBills.length}件</span>
                  </h2>
                  <p className="text-xs font-medium leading-[1.67] text-mirai-text-secondary">
                    解説付きの議案を上に、件名のみの議案をその下にまとめています
                  </p>
                </div>
                {focusBills.length === 0 ? (
                  <p className="py-8 text-center text-mirai-text-muted">
                    この会期の議案はまだ載っていません
                  </p>
                ) : (
                  <SessionBillList bills={focusBills} />
                )}
                <Link
                  href={
                    routes.sessionBills(
                      assembly.slug,
                      focusSession.slug ?? focusSession.session_key
                    ) as Route
                  }
                  className="inline-flex items-center gap-1 self-end text-[13px] font-bold text-mirai-brand-teal-hover hover:underline"
                >
                  {focusSession.name}のページへ
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </section>
            )}

            <ComingSoonSection bills={comingSoonBills} />
          </main>
        </div>
      </Container>

      {pastSessions.length > 0 && (
        <div className="bg-mirai-surface-muted py-10">
          <Container>
            <PastSessionList
              assemblySlug={assembly.slug}
              sessions={pastSessions}
            />
          </Container>
        </div>
      )}

      <Container>
        <BillDisclaimer />
      </Container>

      {settings.show_ai_chat && (
        <HomeChatClient
          assemblySlug={assembly.slug}
          currentDifficulty={currentDifficulty}
          bills={chatBills.map((bill) => ({
            name: chatBillName(bill),
            summary: bill.bill_content?.summary,
            tags: bill.tags?.map((tag) => tag.label) || [],
            isFeatured: featuredBillIds.has(bill.id),
          }))}
        />
      )}
    </>
  );
}
