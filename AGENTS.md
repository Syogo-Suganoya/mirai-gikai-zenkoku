# Repository Guidelines

> `CLAUDE.md`・`GEMINI.md` は `AGENTS.md` へのシンボリックリンクです。編集は `AGENTS.md` に行ってください。

全国の地方議会向けのみらい議会です。設計は [docs/地方議会プラットフォーム設計_v3.md](docs/地方議会プラットフォーム設計_v3.md)、動かし方は [README.md](README.md) を参照してください。

## プロジェクト構成
- `web/` は公開サイト（Next.js）。議会ごとの URL は `/[assembly]/...`。
- `admin/` は管理画面（Next.js、ポート 3001）。議会ごとの画面は `/[assembly]/...`、議案ごとの画面は `/bills/[id]/...`。
- `packages/db/` は Drizzle のスキーマ（`src/schema/tables.ts`）とマイグレーション（`migrations/`）。DB アクセスは `createDb()` から行う。
- `packages/shared/` は web と admin の両方で使う処理。**同じロジックを web と admin に重複して置かない**。ここに切り出す。
- `packages/seed/` はローカル用のデータ投入。`packages/topic-analysis-core/` はトピック分析。
- `tests/db/` は DB を使う統合テスト。

## Next.js の構成
- Bulletproof React の feature ベース構成。`app/` の `page.tsx` は `params`・`searchParams` を受け取って feature に渡すだけにし、画面やロジックは `features/` に置く。
- export 用の `index.ts` は作らず、ファイルから直接 import する。
- Server Components を基本にし、状態やイベントが要るときだけ `"use client"` を付ける。
- 複雑な feature は `server/`（repositories・loaders・actions・services・components）・`client/`（components・hooks）・`shared/`（types・utils）に分ける。server 側には `"server-only"` を付ける。
- 外部依存（DB・API・認証）を持たない計算・変換・判定は純粋関数として `utils/` に切り出す。
- 認可はアプリ層で行う。admin の管理者は全員同じ権限で、すべての議会・機能を扱える（役割や議会ごとの担当は持たない）。ページは `requireUserPage` / `requireAssemblyPage` / `requireBillPage`、Server Action は `requireUser` / `requireAssemblyAction` / `requireBillAction` を通す（ログインと、議会・議案があるかを確かめる）。

## コーディング規約
- Biome（2 スペース、ダブルクォート、セミコロン、80 文字幅）。`pnpm lint:fix` で整形する。
- ファイル名はケバブケース、コンポーネントと型は PascalCase、関数は camelCase。
- アイコンは `lucide-react` を使う（インライン SVG は使わない）。
- ボタンは `@/components/ui/button` の `Button` を使う（`<button>` を直接書かない）。
- 色は `globals.css` の `@theme inline` のトークンを使う（`text-[#xxx]` などの直書きはしない）。
- 内部リンク（Link・router.push・redirect・revalidatePath）は各アプリの `@/lib/routes` の関数を使う。`page.tsx` を追加したら `routes.ts` にも追加する（`routes.test.ts` が同期を確かめる）。
- 1つの議会に実データとダミーを混在させない。実データを入れる処理はダミーが残っていれば確認を求め（`DummyDataExistsError`）、同意があれば消してから入れる。

## DB
- スキーマを変えたら `packages/db/src/schema/tables.ts` を直し、`pnpm db:generate` でマイグレーションを作って `pnpm db:migrate` で当てる。生成された SQL は中身を確かめてからコミットする。
- DB function・トリガーはマイグレーションの SQL に書き、`tests/db/db-function/` に統合テストを付ける。

## テスト
- 単体テストは Vitest で、`*.test.ts` を実装と同じ場所に置く。`utils/` の純粋関数には必ずテストを付ける。
- モックは極力使わない。ロジックを純粋関数に切り出してテストする。DB はモックせず、ローカルの Postgres に対して統合テストを書く（`tests/db/`、web は `*.integration.test.ts`）。統合テストのデータは `tests/db/utils.ts` のヘルパーで作り、テストの最後に消す。
- 外部 API（Gemini など）はインターフェースを通して差し替える。
- 変更したら `pnpm lint`・`pnpm typecheck`・`pnpm test`・`pnpm test:integration`・`pnpm build` が通ることを確かめる（CI と同じ）。

## ドキュメント
- 設計文書は `docs/` に置く。大きく変えるときは新しいファイルを作り、履歴をたどれるようにする。
