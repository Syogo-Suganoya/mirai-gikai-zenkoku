import type { Tx } from "@mirai-gikai/db";
import { toFurigana } from "@mirai-gikai/shared/furigana/generate";
import { applyCsvImport } from "@mirai-gikai/shared/csv-import/apply";
import {
  PREFECTURES,
  prefectureAssemblyName,
  prefectureAssemblySlug,
  prefectureLocalGovCode,
} from "@mirai-gikai/shared/prefectures";

/**
 * 47都道府県議会の議会マスタ（実在の情報なので is_dummy は付けない。ダミーを消しても残す）。
 * 既にあれば名前などを揃えるだけ。
 */
export async function seedPrefectureAssemblies(tx: Tx) {
  return applyCsvImport(
    tx,
    "assemblies",
    null,
    PREFECTURES.map((p) => ({
      local_gov_code: prefectureLocalGovCode(p.code),
      name: prefectureAssemblyName(p),
      type: "prefecture" as const,
      prefecture_code: p.code,
      slug: prefectureAssemblySlug(p),
      official_url: null,
    })),
    { furigana: toFurigana }
  );
}
