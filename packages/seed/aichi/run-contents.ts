/**
 * 愛知県議会の解説付き議案（5件）の本文を入れる（本番で CSV インポートの後に実行する。8.3節）。
 *   DATABASE_URL=<接続先> pnpm --filter @mirai-gikai/seed seed:aichi-contents
 */
import { createDb } from "@mirai-gikai/db";
import { eq } from "@mirai-gikai/db/orm";
import { assemblies } from "@mirai-gikai/db/schema";
import { seedAichiContents } from "./seed-contents";

async function main() {
  const db = createDb();
  const [assembly] = await db
    .select({ id: assemblies.id })
    .from(assemblies)
    .where(eq(assemblies.slug, "aichi-pref"));
  if (!assembly) throw new Error("愛知県議会（aichi-pref）がありません");
  const count = await db.transaction((tx) => seedAichiContents(tx, assembly.id));
  console.log(`✅ 解説付きの議案 ${count} 件を入れました`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
