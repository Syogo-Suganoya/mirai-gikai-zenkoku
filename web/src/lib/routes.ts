/**
 * web アプリの内部ルート定義
 *
 * app/ ディレクトリの page.tsx と 1:1 対応する。
 * Link href や router.push には必ずこのファイルの関数を使うこと。
 * 新しいページを追加したらここにもルートを追加し、テストを通すこと。
 *
 * 議会ごとのページは `/[assembly]/...`（assembly は議会のスラッグ）。
 * 議案は `billKey(bill)`（slug があれば slug、なければ id）で指す。
 */

const enc = encodeURIComponent;

export const routes = {
  // ── 静的ルート ──────────────────────────────────────
  home: () => "/" as const,
  /** 市議会の一覧（現在作成中） */
  cityAssemblies: () => "/cities" as const,
  /** 区町村議会の一覧（現在作成中） */
  townAssemblies: () => "/towns" as const,

  // ── 議会 ──────────────────────────────────────────
  assemblyTop: (assembly: string) => `/${assembly}` as const,
  sessionBills: (assembly: string, session: string) =>
    `/${assembly}/sessions/${enc(session)}` as const,

  // ── 議案 ──────────────────────────────────────────
  billsList: (assembly: string) => `/${assembly}/bills` as const,
  billDetail: (assembly: string, bill: string) =>
    `/${assembly}/bills/${enc(bill)}` as const,
  billOpinions: (assembly: string, bill: string) =>
    `/${assembly}/bills/${enc(bill)}/opinions` as const,
  billTopics: (assembly: string, bill: string) =>
    `/${assembly}/bills/${enc(bill)}/topics` as const,
  billTopicDetail: (
    assembly: string,
    bill: string,
    topicId: string,
    filter?: string
  ) =>
    filter && filter !== "all"
      ? (`/${assembly}/bills/${enc(bill)}/topics/${topicId}?filter=${enc(filter)}` as const)
      : (`/${assembly}/bills/${enc(bill)}/topics/${topicId}` as const),

  // ── インタビュー ──────────────────────────────────
  interviewLP: (assembly: string, bill: string) =>
    `/${assembly}/bills/${enc(bill)}/interview` as const,
  interviewDisclosure: (assembly: string, bill: string) =>
    `/${assembly}/bills/${enc(bill)}/interview/disclosure` as const,
  interviewChat: (assembly: string, bill: string) =>
    `/${assembly}/bills/${enc(bill)}/interview/chat` as const,

  // ── プレビュー（token 付き） ──────────────────────
  previewBillDetail: (assembly: string, bill: string, token: string) =>
    `/preview/${assembly}/bills/${enc(bill)}?token=${enc(token)}` as const,
  previewInterviewLP: (assembly: string, bill: string, token: string) =>
    `/preview/${assembly}/bills/${enc(bill)}/interview?token=${enc(token)}` as const,
  previewInterviewDisclosure: (assembly: string, bill: string, token: string) =>
    `/preview/${assembly}/bills/${enc(bill)}/interview/disclosure?token=${enc(token)}` as const,
  previewInterviewChat: (assembly: string, bill: string, token: string) =>
    `/preview/${assembly}/bills/${enc(bill)}/interview/chat?token=${enc(token)}` as const,

  // ── レポート ──────────────────────────────────────
  publicReport: (reportId: string) => `/report/${reportId}` as const,
  reportComplete: (reportId: string) => `/report/${reportId}/complete` as const,
  legacyReportChatLog: (reportId: string) =>
    `/report/${reportId}/chat-log` as const,
} as const;

/**
 * 議会のスラッグに使えない名前（議会ごとのページの `/[assembly]` と固定のページが衝突しないように）。
 * admin の名前も含めて packages/shared で持つ。
 */
export { RESERVED_ASSEMBLY_SLUGS } from "@mirai-gikai/shared/assemblies/reserved-slugs";
