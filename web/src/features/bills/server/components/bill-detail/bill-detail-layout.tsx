import { Container } from "@/components/layouts/container";
import type { AssemblyWithSettings } from "@/features/assemblies/shared/types";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { isInterviewEnabled } from "@/features/interview-config/shared/utils/is-interview-enabled";
import { getPublicReportsByBillId } from "@/features/interview-report/server/loaders/get-public-reports-by-bill-id";
import { BillTopicsPreviewSection } from "@/features/user-topic-analysis/server/components/bill-topics-preview-section";
import { getPublicTopicAnalysis } from "@/features/user-topic-analysis/server/loaders/get-public-topic-analysis";
import { BillDetailClient } from "../../../client/components/bill-detail/bill-detail-client";
import { BillDisclaimer } from "../../../client/components/bill-detail/bill-disclaimer";
import { BillStatusProgress } from "../../../client/components/bill-detail/bill-status-progress";
import { MiraiStanceCard } from "../../../client/components/bill-detail/mirai-stance-card";
import { TitleOnlyNotice } from "../../../client/components/bill-detail/title-only-notice";
import { type BillWithContent, billKey } from "../../../shared/types";
import { BillShareButtons } from "../share/bill-share-buttons";
import { BillContent } from "./bill-content";
import { BillDetailHeader } from "./bill-detail-header";
import { BillResultSection } from "./bill-result-section";
import { BillSourceSection } from "./bill-source-section";

interface BillDetailLayoutProps {
  bill: BillWithContent;
  assembly: AssemblyWithSettings;
  currentDifficulty: DifficultyLevelEnum;
}

export async function BillDetailLayout({
  bill,
  assembly,
  currentDifficulty,
}: BillDetailLayoutProps) {
  const { settings } = assembly;
  // インタビュー・リアクションは議会設定で出すときだけ。ダミーの議案には出さない
  const showInterview = isInterviewEnabled(settings, bill);
  // チームみらいのスタンスは、議員がいる議会で設定したときだけ出す
  const showMiraiStance =
    settings.show_mirai_stance &&
    assembly.has_mirai_member &&
    (bill.status === "preparing" || bill.mirai_stance);
  const isExplained = bill.publish_level === "explained" && bill.bill_content;

  const [interviewConfig, publicReportsResult, topicAnalysis] =
    await Promise.all([
      showInterview ? getInterviewConfig(bill.id) : Promise.resolve(null),
      showInterview
        ? getPublicReportsByBillId(bill.id)
        : Promise.resolve({ totalCount: 0 }),
      showInterview ? getPublicTopicAnalysis(bill.id) : Promise.resolve(null),
    ]);

  return (
    <div className="container mx-auto pb-8 max-w-4xl">
      {/*
        テキスト選択機能とチャット連携の実装パターン:
        - BillContentはServer Componentのまま保持（SSRによる高速な初期レンダリング）
        - BillDetailClientでクライアントサイド機能（テキスト選択、チャット連携）を提供
      */}
      <BillDetailClient
        bill={bill}
        currentDifficulty={currentDifficulty}
        hasInterviewConfig={interviewConfig != null}
        showChat={settings.show_ai_chat}
      >
        <BillDetailHeader
          bill={bill}
          hasInterviewConfig={interviewConfig != null}
          opinionCount={topicAnalysis?.total_opinions ?? 0}
          topicCount={topicAnalysis?.topics.length ?? 0}
        />
        <Container>
          {/* 審議の進み具合 */}
          <div className="my-8">
            <BillStatusProgress
              status={bill.status}
              statusNote={bill.status_note}
            />
          </div>

          {isExplained ? (
            <BillContent bill={bill} />
          ) : (
            <div className="my-8">
              <TitleOnlyNotice sourceUrl={bill.source_url} />
            </div>
          )}
        </Container>
      </BillDetailClient>

      <Container>
        {/* 議決結果と会派ごとの賛否 */}
        <div className="my-8">
          <BillResultSection
            bill={bill}
            granularity={settings.vote_granularity}
          />
        </div>

        {/* 議案のトピック一覧（AIインタビュー意見の整理） */}
        {showInterview && (
          <div className="my-8">
            <BillTopicsPreviewSection
              assemblySlug={bill.assembly_slug}
              billKey={billKey(bill)}
              topics={topicAnalysis?.topics ?? []}
              publicReportCount={publicReportsResult.totalCount}
            />
          </div>
        )}

        {interviewConfig != null && (
          <div className="my-8">
            <InterviewLandingSection
              assemblySlug={bill.assembly_slug}
              billKey={billKey(bill)}
            />
          </div>
        )}
        {showMiraiStance && (
          <div className="my-8">
            <MiraiStanceCard
              stance={bill.mirai_stance}
              billStatus={bill.status}
            />
          </div>
        )}

        {/* 出典と解説の確認 */}
        <div className="my-8">
          <BillSourceSection bill={bill} />
        </div>

        {/* シェアボタン */}
        <div className="my-8">
          <BillShareButtons bill={bill} />
        </div>

        {/* データの出典と免責事項 */}
        <div className="my-8">
          <BillDisclaimer />
        </div>
      </Container>
    </div>
  );
}
