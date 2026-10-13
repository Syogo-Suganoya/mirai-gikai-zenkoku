import path from "node:path";
import { defineConfig } from "vitest/config";

const testsDir = path.resolve(__dirname);

export default defineConfig({
  test: {
    globals: true,
    root: testsDir,
    include: ["**/*.test.ts"],
    // テスト間のデータ干渉を防ぐためシーケンシャル実行
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globalSetup: [path.resolve(testsDir, "setup.ts")],
    testTimeout: 30000,
    // 手元の .env に本物のキーがあっても、統合テストから外部 API（Gemini）を呼ばない。
    // 呼ぶ箇所はキーが無いとすぐに失敗し、その場合の扱い（モデレーション失敗でも完了する等）を確かめる
    env: {
      GOOGLE_GENERATIVE_AI_API_KEY: "",
    },
    // workspace パッケージ（@mirai-gikai/*）も vitest で変換し、server-only の差し替えを効かせる
    server: { deps: { inline: [/@mirai-gikai\//] } },
  },
  resolve: {
    alias: {
      "server-only": path.resolve(testsDir, "server-only-stub.ts"),
    },
  },
});
