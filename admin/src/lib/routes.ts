/**
 * admin アプリの内部ルート定義
 *
 * app/ ディレクトリの page.tsx と 1:1 対応する。
 * Link href や router.push には必ずこのファイルの関数を使うこと。
 * 新しいページを追加したらここにもルートを追加し、テストを通すこと。
 */

import type { AssemblyKind } from "@mirai-gikai/shared/assemblies/assembly-kind";

// ── 静的ルート ──────────────────────────────────────
export const routes = {
  /** 議会一覧（区分ごと。都道府県はクエリなし） */
  home: (kind?: AssemblyKind) =>
    kind && kind !== "prefecture"
      ? (`/?kind=${kind}` as const)
      : ("/" as const),
  login: () => "/login" as const,
  accountPassword: () => "/account/password" as const,
  admins: () => "/admins" as const,
  tags: () => "/tags" as const,
  experts: () => "/experts" as const,
  interviews: () => "/interviews" as const,
  interviewOpinionBackfill: () => "/interview-opinion-backfill" as const,
  userTopicAnalysisAll: () => "/user-topic-analysis" as const,
  /** 議会マスタの CSV 取り込み */
  assemblyMasterImport: () => "/assemblies/import" as const,

  // ── 議会配下 ──────────────────────────────────────
  assemblyBills: (assembly: string) => `/${assembly}/bills` as const,
  assemblyBillNew: (assembly: string) => `/${assembly}/bills/new` as const,
  assemblySessions: (assembly: string) => `/${assembly}/sessions` as const,
  assemblyImport: (assembly: string) => `/${assembly}/import` as const,
  assemblySettings: (assembly: string) => `/${assembly}/settings` as const,

  // ── 議案配下 ──────────────────────────────────────
  billEdit: (billId: string) => `/bills/${billId}/edit` as const,
  billContentsEdit: (billId: string) =>
    `/bills/${billId}/contents/edit` as const,
  billUserTopicAnalysis: (billId: string) =>
    `/bills/${billId}/user-topic-analysis` as const,
  billAnalysisViewer: (billId: string) =>
    `/bills/${billId}/analysis-viewer` as const,

  // インタビュー
  billInterview: (billId: string) => `/bills/${billId}/interview` as const,
  billInterviewNew: (billId: string) =>
    `/bills/${billId}/interview/new` as const,
  billInterviewEdit: (billId: string, configId: string) =>
    `/bills/${billId}/interview/${configId}/edit` as const,

  // レポート（インタビュー設定配下）
  billReports: (billId: string, configId: string) =>
    `/bills/${billId}/interview/${configId}/reports` as const,
  billReportsSearch: (billId: string, configId: string) =>
    `/bills/${billId}/interview/${configId}/reports/search` as const,
  billReportDetail: (billId: string, configId: string, sessionId: string) =>
    `/bills/${billId}/interview/${configId}/reports/${sessionId}` as const,

  // トピック解析（インタビュー設定配下）
  billTopicAnalysis: (billId: string, configId: string) =>
    `/bills/${billId}/interview/${configId}/topic-analysis` as const,
  billTopicAnalysisDetail: (
    billId: string,
    configId: string,
    versionId: string
  ) =>
    `/bills/${billId}/interview/${configId}/topic-analysis/${versionId}` as const,
} as const;
