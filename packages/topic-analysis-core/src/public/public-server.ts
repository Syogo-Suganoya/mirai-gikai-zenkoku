import "server-only";

// 公開（PII セーフ・公開フィルタ固定）読み取りの**サーバ専用**エントリポイント。
// web の公開ページが使う。DB に触れる repository / loaders をここに集約し、
// ブラウザ安全な純粋ロジック（./public）と分離する。
export * from "./public";
export {
  type PublishedAnalysisData,
  findPublicBillRespondentRows,
  findPublishedAnalysis,
} from "./public-read-repository";
export {
  getPublicBillRespondents,
  getPublicTopicAnalysis,
} from "./loaders";
