/**
 * 本番・ステージングの DB に初期データを入れる（最初の1回だけ）。
 *   DATABASE_URL=<Neon の直接接続 URL> pnpm --filter @mirai-gikai/seed seed:initial
 *
 * 1. タグ・47都道府県議会の議会マスタ（既にあれば残す）
 * 2. 愛知県議会の初期データ（CSV インポートと同じ処理。解説付き5件の本文も入れ、公開する）
 * 3. 46都道府県議会のダミーデータ
 *
 * pnpm seed と違い、データを消さず、ローカル用の管理者も作らない（管理者は pnpm admin:create）。
 * 愛知県議会の議案を入れ直すと管理画面で直した公開状態・解説を上書きするので、
 * 議案が既にあれば止める（--force で続ける）。
 */
import { createDb } from "@mirai-gikai/db";
import { eq, sql } from "@mirai-gikai/db/orm";
import { assemblies, bills } from "@mirai-gikai/db/schema";
import { seedAichi } from "./aichi/seed-aichi";
import { seedDummy } from "./dummy/seed-dummy";
import { seedPrefectureAssemblies } from "./lib/prefecture-assemblies";
import { seedTags } from "./lib/tags";

async function main() {
  const force = process.argv.includes("--force");
  const db = createDb();

  const [existing] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bills)
    .innerJoin(assemblies, eq(assemblies.id, bills.assembly_id))
    .where(eq(assemblies.slug, "aichi-pref"));
  if (existing.count > 0 && !force) {
    throw new Error(
      `愛知県議会の議案が既に ${existing.count} 件あります。入れ直すと管理画面での変更を上書きするため止めました（続けるなら --force）`
    );
  }

  console.log("🌱 初期データを入れます...");
  await db.transaction(async (tx) => {
    await seedTags(tx);
    await seedPrefectureAssemblies(tx);
    console.log("✅ タグと47都道府県議会");

    await seedAichi(tx);
    console.log("✅ 愛知県議会");

    const dummy = await seedDummy(tx);
    console.log(`✅ ダミーの議案 ${dummy.billCount} 件`);
  });
  console.log("🎉 完了しました。管理者は pnpm admin:create で作ってください");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
