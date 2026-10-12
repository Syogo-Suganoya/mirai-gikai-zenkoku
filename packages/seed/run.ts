/**
 * ローカル開発用のデータをまとめて入れる（本家の pnpm seed の置き換え）。
 *   pnpm seed
 *
 * 1. 議会・議案などのデータを消す（管理画面のユーザーは残す）
 * 2. タグ・47都道府県議会の議会マスタ
 * 3. 愛知県議会の初期データ（CSV インポートと同じ処理で取り込む）
 * 4. 46都道府県議会のダミーデータ
 * 5. ローカル開発用の全体管理者
 *
 * データを消すので、DATABASE_URL がローカルの DB を指しているときだけ実行できる。
 */
import { createDb } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { seedAichi } from "./aichi/seed-aichi";
import { seedDummy } from "./dummy/seed-dummy";
import { isLocalDatabaseUrl } from "./lib/database-url";
import { seedLocalAdmin } from "./lib/local-admin";
import { seedPrefectureAssemblies } from "./lib/prefecture-assemblies";
import { seedTags } from "./lib/tags";

async function main() {
  if (!isLocalDatabaseUrl(process.env.DATABASE_URL)) {
    throw new Error(
      "pnpm seed はデータを消すため、ローカルの DB でだけ実行できます。本番には seed:dummy / CSV インポートを使ってください"
    );
  }

  const db = createDb();
  console.log("🌱 データを入れます...");
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      truncate table
        assemblies, tags, anonymous_visitors, chat_usage_events, api_rate_limits,
        csv_import_jobs, login_attempts
      restart identity cascade
    `);

    await seedTags(tx);
    await seedPrefectureAssemblies(tx);
    console.log("✅ タグと47都道府県議会");

    await seedAichi(tx);
    console.log("✅ 愛知県議会");

    const dummy = await seedDummy(tx);
    console.log(`✅ ダミーの議案 ${dummy.billCount} 件`);

    const email = await seedLocalAdmin(tx);
    console.log(`✅ ローカルの全体管理者: ${email}`);
  });
  console.log("🎉 完了しました");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
