import postgres from "postgres";

/** DB に接続でき、マイグレーションが当たっているかを先に確かめる */
export async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "環境変数 DATABASE_URL が未設定です。`.env.example` を `.env` にコピーしてください。"
    );
  }
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client`select 1 from assemblies limit 1`;
  } catch (error) {
    throw new Error(
      [
        "DB への接続に失敗しました。",
        "`pnpm db:up` で Postgres を起動し、`pnpm db:migrate` を実行してください。",
        `エラー: ${String(error)}`,
      ].join("\n")
    );
  } finally {
    await client.end();
  }
  console.log("✓ DB 接続確認完了");
}

export async function teardown() {}
