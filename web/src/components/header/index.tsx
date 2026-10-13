import { toAssemblyKind } from "@mirai-gikai/shared/assemblies/assembly-kind";
import { getAssemblySummaries } from "@/features/assemblies/server/loaders/get-assembly-summaries";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [difficultyLevel, assemblies] = await Promise.all([
    getDifficultyLevel(),
    getAssemblySummaries(),
  ]);
  // 議会のページでも、ヘッダーで都道府県・市・区町村のどれを見ているか示す
  const kindBySlug = Object.fromEntries(
    assemblies.map((a) => [a.slug, toAssemblyKind(a.type)])
  );
  return (
    <HeaderClient difficultyLevel={difficultyLevel} kindBySlug={kindBySlug} />
  );
}
