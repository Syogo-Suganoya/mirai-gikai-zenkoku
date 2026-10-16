/**
 * ふりがなが付いていない議案（SQL で直接入れた議案など）の件名・解説の本文に、ふりがなを付ける。
 *   DATABASE_URL=<接続先> pnpm --filter @mirai-gikai/seed furigana:backfill [--assembly <スラッグ>] [--dry-run]
 *
 * 付いているもの（管理画面で読みを直したものを含む）は変えない。何度流しても同じ結果になる。
 * 公開サイトのキャッシュ（最長10分）が切れると表示に反映される。
 */
import { createDb } from "@mirai-gikai/db";
import { backfillFurigana } from "@mirai-gikai/shared/furigana/backfill";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const assemblySlug = argValue("--assembly");
  const dryRun = process.argv.includes("--dry-run");
  const db = createDb();

  const result = await backfillFurigana(db, { assemblySlug, dryRun });
  const target = assemblySlug ?? "すべての議会";
  const verb = dryRun ? "付ける対象" : "付けた";
  console.log(
    `${target}: 件名 ${result.billNames} 件・解説の本文 ${result.contents} 件にふりがなを${verb}`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
