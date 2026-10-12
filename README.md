# みらい議会＠全国地方議会

全国の地方議会（都道府県議会・市区町村議会）の議案を、AI の解説つきでわかりやすく届けるサービスです。
チームみらいの [みらい議会](https://gikai.team-mir.ai/)（[リポジトリ](https://github.com/team-mirai/mirai-gikai)）を元に、地方議会向けに作り直しています。

> これは政党チームみらいが運営しているものではありません。

設計は [docs/地方議会プラットフォーム設計_v3.md](docs/地方議会プラットフォーム設計_v3.md) にあります。

## 構成

| ディレクトリ | 内容 |
|---|---|
| `web/` | 公開サイト（Next.js）。議会の選択・議会トップ・議案一覧／詳細・AI チャット・AI インタビュー |
| `admin/` | 管理画面（Next.js、ポート 3001）。議会ごとの議案・会期・CSV 取り込み・議会設定・担当者 |
| `packages/db/` | Drizzle のスキーマとマイグレーション（PostgreSQL） |
| `packages/shared/` | web と admin で共有する処理（AI モデル、CSV 取り込み、ふりがな、ラベルなど） |
| `packages/topic-analysis-core/` | インタビュー意見のトピック分析 |
| `packages/seed/` | ローカル用のデータ投入（愛知県議会の実データ・ダミー議会） |
| `tests/db/` | DB を使う統合テスト（DB function・リポジトリ） |
| `worker/` | トピック分析の定期実行（今後 GitHub Actions から動かす） |

主な技術: Next.js 15 / TypeScript / Drizzle ORM / PostgreSQL / Vercel AI SDK（Gemini）/ Tailwind CSS / Biome / Vitest

## ローカルで動かす

必要なもの: Node.js 20 以上、pnpm、Docker

```bash
pnpm install
cp .env.example .env    # GOOGLE_GENERATIVE_AI_API_KEY などを必要に応じて設定
pnpm db:up              # Docker の PostgreSQL（ポート 54322）を起動
pnpm db:migrate         # マイグレーションを適用
pnpm seed               # 愛知県議会のデータとダミー議会を投入
pnpm admin:create you@example.com   # 最初の全体管理者を作る（初期パスワードが表示される）
pnpm dev                # web（3000）と admin（3001）を起動
```

DB を作り直すときは `pnpm db:reset`（コンテナの削除 → 起動 → マイグレーション → シード）。

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `pnpm lint` / `pnpm lint:fix` | Biome のフォーマットと lint |
| `pnpm typecheck` | 全パッケージの型チェック |
| `pnpm test` | 単体テスト |
| `pnpm test:integration` | DB を使う統合テスト（`pnpm db:up` と `pnpm db:migrate` のあとで実行） |
| `pnpm build` | web と admin のビルド |
| `pnpm db:generate` | `packages/db/src/schema` の変更からマイグレーションを作る |

## 運用環境（予定）

| 用途 | サービス |
|---|---|
| web / admin | Vercel |
| DB | Neon（PostgreSQL） |
| ファイル | Cloudflare R2 |
| AI | Google Gemini API |
| CI | GitHub Actions（`.github/workflows`） |

## ライセンス

[AGPL-3.0](LICENSE)。元にしたみらい議会のライセンスを引き継いでいます。
fork して運営する場合の注意は [FORK_GUIDELINES.md](FORK_GUIDELINES.md) を見てください。
