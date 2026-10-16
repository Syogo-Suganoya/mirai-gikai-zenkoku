/**
 * 46都道府県議会のダミーデータだけを入れる（本番にも入れる）。
 * 議会マスタがなければ作り、各議会の既存のダミーを入れ直す。実データには触らない。
 *   DATABASE_URL=<接続先> pnpm --filter @mirai-gikai/seed seed:dummy
 */
import { createDb } from "@mirai-gikai/db";
import { seedPrefectureAssemblies } from "../lib/prefecture-assemblies";
import { seedDummy } from "./seed-dummy";

async function main() {
  const db = createDb();
  const result = await db.transaction(async (tx) => {
    await seedPrefectureAssemblies(tx);
    return seedDummy(tx);
  });
  console.log(
    `✅ ダミーの議案 ${result.billCount} 件を入れました（実データのある議会 ${result.skipped} 件は対象外）`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
