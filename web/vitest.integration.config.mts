import path from "node:path";
import { defineConfig } from "vitest/config";
import { coverageExclude } from "./vitest.shared";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.integration.test.ts"],
    setupFiles: [path.resolve(__dirname, "vitest.integration.setup.ts")],
    // テスト間のデータ干渉を防ぐためシーケンシャル実行
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30000,
    // workspace パッケージ（@mirai-gikai/*）も vitest で変換し、server-only の差し替えを効かせる
    server: { deps: { inline: [/@mirai-gikai\//] } },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary"],
      reportsDirectory: "./coverage-integration",
      include: ["src/**/*.{ts,tsx}"],
      exclude: coverageExclude,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test-utils": path.resolve(__dirname, "../tests/db"),
      // `@mirai-gikai/shared` 等の workspace パッケージは vitest が externalize するため、
      // それらが持つ `import "server-only"` は setup の vi.mock では捕まらない。
      // 解決レベルで空 stub に差し替え、Next.js のランタイムガードを無効化する。
      "server-only": path.resolve(
        __dirname,
        "../tests/db/server-only-stub.ts"
      ),
    },
  },
});
