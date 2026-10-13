import {
  type AssemblyKind,
  toAssemblyKind,
} from "@mirai-gikai/shared/assemblies/assembly-kind";
import { findPrefectureByCode } from "@mirai-gikai/shared/prefectures";
import type { AssemblyListItem } from "../types";

/** 議会の都道府県名（見つからなければ空文字） */
export function assemblyPrefectureName(assembly: AssemblyListItem): string {
  return findPrefectureByCode(assembly.prefecture_code)?.name ?? "";
}

/**
 * 議会一覧の絞り込み。区分（都道府県・市・区町村）と、
 * 議会名・都道府県名・スラッグの部分一致で絞る。並び順はそのまま（都道府県コード順）。
 */
export function filterAssemblies(
  assemblies: readonly AssemblyListItem[],
  { kind, query }: { kind: AssemblyKind; query: string }
): AssemblyListItem[] {
  const q = query.trim().toLowerCase();
  return assemblies.filter(
    (assembly) =>
      toAssemblyKind(assembly.type) === kind &&
      (q === "" ||
        assembly.name.includes(q) ||
        assemblyPrefectureName(assembly).includes(q) ||
        assembly.slug.toLowerCase().includes(q))
  );
}
