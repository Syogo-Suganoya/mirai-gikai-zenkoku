import "server-only";

import { DEFAULT_INTERVIEW_CHAT_MODEL } from "@/lib/ai/models";
import { DisclosureBreadcrumb } from "../../shared/components/disclosure-breadcrumb";
import type { InterviewConfig } from "../loaders/get-interview-config";

interface InterviewDisclosurePageProps {
  assemblySlug: string;
  billId: string;
  billName: string;
  interviewConfig: InterviewConfig;
  systemPrompt: string;
  summaryPrompt: string;
  previewToken?: string;
}

function StaticDisclosureSection() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-black leading-[1.5] my-4">
        AIインタビューに関する情報開示
      </h1>
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <h2 className="text-[22px] font-bold text-black leading-[1.64]">
          AIインタビューの透明性および技術仕様に関する開示事項
        </h2>
        <div className="text-sm leading-[1.83] text-black space-y-4">
          <div>
            <p className="font-bold">
              AIインタビューの透明性と技術仕様について
            </p>
            <p className="mt-1">
              本インタビューの実施にあたり、公平性の確保および回答者との信頼関係に基づくAIとの共存を目的として、以下の通り技術仕様および運用方針を開示いたします。
            </p>
          </div>

          <div>
            <p className="font-bold">1. 実施目的</p>
            <p className="mt-1">
              議会で審議されている議案について、住民の考えや経験を集め、誰でも読める形で示すことを目的としています。公開を許可いただいた回答は、AIが偏りなくトピックにまとめ、議案ページに表示します。
            </p>
          </div>

          <div>
            <p className="font-bold">2. 透明性の担保（プロンプトの開示）</p>
            <p className="mt-1">
              AIがブラックボックス化することを回避し、回答者がAIの振る舞いを事前に確認できるよう、AIインタビューアーに設定されている全てのプロンプト（指示書）を以下の通り公開いたします。
            </p>
            <p className="mt-1">
              これにより、質問内容における誘導の有無や、特定の意図への偏りがないことを担保し、安心して参加いただける環境を整えています。
            </p>
          </div>

          <div>
            <p className="font-bold">3. 回答データの取り扱い</p>
            <p className="mt-1">
              収集された回答データの管理および活用については、以下の通り規定します。
            </p>
            <ul className="mt-2 space-y-2 list-none">
              <li>
                <span className="font-bold">保存期間：</span>
                回答は期限を決めずに保存します。
              </li>
              <li>
                <span className="font-bold">使用するAI：</span>
                インタビューとトピックの分析には、Google の Gemini
                API（有料プラン）を使います。有料プランでは、入力された内容が
                Google の AI の学習に使われることはありません。
              </li>
              <li>
                <span className="font-bold">活用の範囲：</span>
                公開を許可いただいた回答は、このサイトへの掲載と、AIによるトピックの分析に使います。将来、集まった意見をチームみらいの議員などに見せることがあります。
              </li>
              <li>
                <span className="font-bold">分析プロセスの透明化：</span>
                AIを用いた分析手法およびそのプロセスについては、客観性を担保するため、適宜その詳細を開示するものとします。
              </li>
            </ul>

            <div className="mt-3">
              <p className="font-bold">公開設定に応じた取り扱い：</p>
              <ul className="mt-1 space-y-2 list-none">
                <li>
                  <span className="font-bold">公開を希望しない場合：</span>
                  回答はサイトに掲載せず、トピックの集計にも使いません。回答者の承諾なく、原文や個人が特定できる形で外部に公開されることはありません。
                </li>
                <li>
                  <span className="font-bold">公開を希望する場合：</span>
                  内容の確認（不適切な表現のチェック）のあと、回答の要約とインタビュー原文が匿名でこのサイトに掲載され、誰でも読めるようになります。AIがまとめる議案のトピックにも使われます。公開はあとから取り消せます。
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelSection({
  interviewConfig,
}: Pick<InterviewDisclosurePageProps, "interviewConfig">) {
  const chatModel = interviewConfig?.chat_model ?? DEFAULT_INTERVIEW_CHAT_MODEL;

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-black leading-[1.5]">
        使用モデル
      </h1>
      <div className="bg-white rounded-2xl p-6 space-y-2">
        <p className="text-sm leading-[1.83] text-black">
          対話エンジンには以下のモデルを採用しています。
        </p>
        <p className="text-sm leading-[1.83] text-black">
          モデル名称： {chatModel}
        </p>
      </div>
    </div>
  );
}

function PromptSection({
  billName,
  systemPrompt,
  summaryPrompt,
}: Pick<
  InterviewDisclosurePageProps,
  "billName" | "systemPrompt" | "summaryPrompt"
>) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-black leading-[1.5]">
        AIに与えられているプロンプト
      </h1>

      <div className="bg-white rounded-2xl p-6 space-y-4">
        <p className="text-[15px] font-normal text-black leading-[1.87]">
          {billName}に関するAIインタビューにおけるプロンプト
        </p>

        <div className="space-y-2">
          <p className="text-sm font-bold text-black">
            インタビュー用プロンプト（指示書）
          </p>
          <pre className="text-sm leading-[1.83] text-black whitespace-pre-wrap break-words">
            {systemPrompt}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-bold text-black">
            要約・レポート生成用プロンプト（指示書）
          </p>
          <p className="text-sm leading-[1.83] text-black">
            インタビュー終了後、回答内容をレポートにまとめる際にAIに与えられるプロンプトです。
          </p>
          <pre className="text-sm leading-[1.83] text-black whitespace-pre-wrap break-words">
            {summaryPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function InterviewDisclosurePage({
  assemblySlug,
  billId,
  previewToken,
  ...props
}: InterviewDisclosurePageProps) {
  return (
    <div className="flex flex-col gap-8 pb-8 bg-mirai-light-gradient">
      <div className="flex flex-col gap-8 px-4 pt-24 md:pt-12 max-w-[600px] mx-auto w-full">
        <DisclosureBreadcrumb
          assemblySlug={assemblySlug}
          billId={billId}
          previewToken={previewToken}
        />
        <StaticDisclosureSection />
        <ModelSection interviewConfig={props.interviewConfig} />
        <PromptSection
          billName={props.billName}
          systemPrompt={props.systemPrompt}
          summaryPrompt={props.summaryPrompt}
        />
        <DisclosureBreadcrumb
          assemblySlug={assemblySlug}
          billId={billId}
          previewToken={previewToken}
        />
      </div>
    </div>
  );
}
