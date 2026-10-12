import "server-only";

import { ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { requireInterviewBill } from "@/features/interview-config/server/loaders/require-interview-bill";
import { countPublicReportsByBillId } from "@/features/interview-report/server/repositories/interview-report-repository";
import { routes } from "@/lib/routes";
import { TopicOpinionList } from "../../client/components/topic-opinion-list";
import {
  TopicCategoryChips,
  TopicSentiment,
} from "../../shared/components/topic-meta";
import {
  type TopicFilter,
  topicFilterLabel,
} from "../../shared/utils/filter-topics";
import { splitSummaryLines } from "../../shared/utils/split-summary-lines";
import { getPublicTopicDetail } from "../loaders/get-public-topic-detail";

function TopicNav({
  assemblySlug,
  billKey,
  position,
  total,
  prevTopicId,
  nextTopicId,
  filter,
}: {
  assemblySlug: string;
  billKey: string;
  position: number;
  total: number;
  prevTopicId: string | null;
  nextTopicId: string | null;
  filter: TopicFilter;
}) {
  return (
    // 3カラムグリッドで中央の位置カウンタを常に中央寄せにする
    // （前後リンクの有無にかかわらず位置がぶれないようにする）。
    <div className="grid grid-cols-3 items-center text-[13px] font-medium text-mirai-text">
      {/* 先頭では「前のトピック」を非表示にする。 */}
      <div className="justify-self-start">
        {prevTopicId && (
          <Link
            href={
              routes.billTopicDetail(
                assemblySlug,
                billKey,
                prevTopicId,
                filter
              ) as Route
            }
            className="flex items-center gap-1 text-primary-accent hover:underline"
          >
            <ChevronLeft className="size-4 shrink-0" />
            前のトピック
          </Link>
        )}
      </div>

      <span className="justify-self-center text-mirai-text-muted">
        {position}/{total}
      </span>

      {/* 末尾では「次のトピック」を非表示にする。 */}
      <div className="justify-self-end">
        {nextTopicId && (
          <Link
            href={
              routes.billTopicDetail(
                assemblySlug,
                billKey,
                nextTopicId,
                filter
              ) as Route
            }
            className="flex items-center gap-1 text-primary-accent hover:underline"
          >
            次のトピック
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}

interface TopicDetailPageProps {
  assemblySlug: string;
  billKey: string;
  topicId: string;
  /** 一覧から引き継いだフィルタ。前後トピックの並びとリンクに反映する。 */
  filter?: TopicFilter;
}

export async function TopicDetailPage({
  assemblySlug,
  billKey,
  topicId,
  filter = "all",
}: TopicDetailPageProps) {
  const { bill } = await requireInterviewBill(assemblySlug, billKey);
  const billId = bill.id;
  const [detail, publicReportCount, interviewConfig] = await Promise.all([
    getPublicTopicDetail(billId, topicId, filter),
    countPublicReportsByBillId(billId),
    getInterviewConfig(billId),
  ]);

  if (!detail) {
    notFound();
  }

  // 相対日時はサーバーで基準時刻を固定し、クライアントでの再計算ずれを防ぐ。
  const nowMs = Date.now();

  const { topic, position, total, prevTopicId, nextTopicId } = detail;
  const billTitle = bill.bill_content?.title || bill.name;

  const filterLabel = topicFilterLabel(filter);
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "議案詳細", href: routes.billDetail(assemblySlug, billKey) },
    {
      label: filterLabel ? `トピック一覧（${filterLabel}）` : "トピック一覧",
      href: routes.billTopics(assemblySlug, billKey),
    },
    { label: "トピック詳細" },
  ];

  return (
    <div className="min-h-dvh bg-mirai-surface pt-24 md:pt-0">
      <Container>
        <div className="flex flex-col gap-6 pb-8 md:pt-8">
          {/* パンくず + 議案タイトル */}
          <div className="flex flex-col gap-2">
            <Breadcrumb items={breadcrumbItems} />
            <Link
              href={routes.billDetail(assemblySlug, billKey) as Route}
              className="inline-flex items-center gap-2 text-[15px] font-medium leading-6 text-black"
            >
              <span className="underline">{billTitle}</span>
              <Undo2 className="size-4 shrink-0" />
            </Link>
          </div>

          <h1 className="text-[22px] font-bold leading-9 text-mirai-text">
            💬トピックに含まれる意見
          </h1>

          <TopicNav
            assemblySlug={assemblySlug}
            billKey={billKey}
            position={position}
            total={total}
            prevTopicId={prevTopicId}
            nextTopicId={nextTopicId}
            filter={filter}
          />

          {/* トピックヘッダー */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-5">
            <h2 className="text-base font-bold leading-6 text-mirai-text">
              {topic.title}
              <span className="ml-1 text-[11px] font-medium text-topic-count">
                （{topic.opinion_count}件）
              </span>
            </h2>
            <TopicSentiment sentiment={topic.sentiment} />
            <TopicCategoryChips topic={topic} />
            {topic.description && (
              <ul className="flex list-disc flex-col gap-1 pl-5 text-[15px] leading-6 text-mirai-text">
                {splitSummaryLines(topic.description).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>

          {/* 意見一覧 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold text-topic-label">
              このトピックに含まれる{topic.opinion_count}件の意見
            </h3>
            <TopicOpinionList
              opinions={topic.opinions}
              publicReportCount={publicReportCount}
              nowMs={nowMs}
            />
          </div>

          {/* AIインタビューCTA */}
          {interviewConfig != null && (
            <InterviewLandingSection
              assemblySlug={assemblySlug}
              billKey={billKey}
            />
          )}
        </div>
      </Container>
    </div>
  );
}
