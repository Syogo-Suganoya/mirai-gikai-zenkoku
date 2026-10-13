// Vercel Ignored Build Step から実行されるスクリプト。
// exit 0 = ビルドをスキップ / exit 1 = ビルドを続行する仕様。
// https://vercel.com/docs/project-configuration/vercel-json#ignorecommand
//
// main は .github/workflows/deploy.yml がマイグレーションのあとに Deploy Hook で
// ビルドさせる（Git 連携のデプロイは vercel.json で止めている）。
// それ以外のブランチの Preview はビルドしない。Preview 用の DB（PR ごとの Neon の
// ブランチ）をまだ用意していないため。
const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";

if (branch === "main") {
  console.log("Proceeding with build: main deploys via deploy hook");
  process.exit(1);
}

console.log(`Skipping build: no preview deployments (branch "${branch}")`);
process.exit(0);
