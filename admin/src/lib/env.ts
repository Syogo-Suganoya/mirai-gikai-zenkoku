/**
 * 環境変数の設定
 * アプリケーション全体で使用する環境変数を一元管理
 */

export const env = {
  adminUrl: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.ADMIN_URL || "http://localhost:3001",
  webUrl: process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000",
  revalidateSecret: process.env.REVALIDATE_SECRET,
  // 公開ファイル（サムネイル・取り込んだ CSV）の置き場所（Vercel Blob）。
  // Vercel でストアをプロジェクトにつなぐと自動で入る。未設定ならローカル開発では web/public/local-storage を使う
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
  },
} as const;

// 型定義
export type Env = typeof env;
