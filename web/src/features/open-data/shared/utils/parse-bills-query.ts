import {
  DEFAULT_DIFFICULTY,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "@/features/bill-difficulty/shared/types";
import { isDifficultyLevel } from "@/features/bill-difficulty/shared/utils/is-difficulty-level";
import {
  type ParsedPaginationQuery,
  parsePaginationQuery,
} from "./parse-pagination-query";

export type ParsedDifficultyQuery =
  | { ok: true; difficulty: DifficultyLevelEnum }
  | { ok: false; error: string };

/**
 * difficulty パラメータを検証・解析する。未指定は既定値。
 */
export function parseDifficultyQuery(
  searchParams: URLSearchParams
): ParsedDifficultyQuery {
  const value = searchParams.get("difficulty");
  if (value === null) {
    return { ok: true, difficulty: DEFAULT_DIFFICULTY };
  }
  if (!isDifficultyLevel(value)) {
    return {
      ok: false,
      error: `difficulty は ${VALID_DIFFICULTY_LEVELS.join(" / ")} のいずれかで指定してください`,
    };
  }
  return { ok: true, difficulty: value };
}

/** 議会のスラッグとして受け付ける形（英小文字・数字・ハイフン） */
const ASSEMBLY_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export type ParsedAssemblyQuery =
  | { ok: true; assemblySlug: string | null }
  | { ok: false; error: string };

/**
 * assembly パラメータ（議会のスラッグ）を検証・解析する。未指定は全議会。
 */
export function parseAssemblyQuery(
  searchParams: URLSearchParams
): ParsedAssemblyQuery {
  const value = searchParams.get("assembly");
  if (value === null || value === "") {
    return { ok: true, assemblySlug: null };
  }
  if (!ASSEMBLY_SLUG_RE.test(value)) {
    return {
      ok: false,
      error:
        "assembly は議会のスラッグ（英小文字・数字・ハイフン）で指定してください",
    };
  }
  return { ok: true, assemblySlug: value };
}

export type ParsedBillsQuery =
  | (Extract<ParsedPaginationQuery, { ok: true }> & {
      difficulty: DifficultyLevelEnum;
      assemblySlug: string | null;
    })
  | { ok: false; error: string };

/**
 * 議案オープンデータAPIのクエリパラメータ
 * （limit / cursor / difficulty / assembly）を検証・解析する。
 */
export function parseBillsQuery(
  searchParams: URLSearchParams
): ParsedBillsQuery {
  const pagination = parsePaginationQuery(searchParams);
  if (!pagination.ok) {
    return pagination;
  }

  const difficulty = parseDifficultyQuery(searchParams);
  if (!difficulty.ok) {
    return difficulty;
  }

  const assembly = parseAssemblyQuery(searchParams);
  if (!assembly.ok) {
    return assembly;
  }

  return {
    ...pagination,
    difficulty: difficulty.difficulty,
    assemblySlug: assembly.assemblySlug,
  };
}
