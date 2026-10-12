import { RESERVED_ASSEMBLY_SLUGS } from "./routes";

/**
 * ページレイアウトに関するユーティリティ
 *
 * 議会トップ・議案一覧・議案詳細を「メインページ」として扱い、
 * - DifficultySelectorを表示
 * - チャットサイドバー用のオフセットレイアウトを使用
 */

const RESERVED = new Set<string>(RESERVED_ASSEMBLY_SLUGS);

/**
 * メインページ（議会トップ、議案一覧、議案詳細）かどうかを判定。
 * 議会選択（/）はチャットがないので含めない（地図を全幅で出す）。
 */
export function isMainPage(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return false;
  if (RESERVED.has(parts[0])) return false;
  // 議会トップ（/[assembly]）
  if (parts.length === 1) return true;
  // 議案一覧（/[assembly]/bills）・議案詳細（/[assembly]/bills/[id]）- サブパスは除外
  return parts[1] === "bills" && parts.length <= 3;
}

/** インタビューチャットページかどうかを判定 */
export function isInterviewPage(pathname: string): boolean {
  // /bills/[id]/interview/chat
  return /\/bills\/[^/]+\/interview\/chat$/.test(pathname);
}

/** インタビューセクション（LP・チャット含む）かどうかを判定 */
export function isInterviewSection(pathname: string): boolean {
  // /bills/[id]/interview 以下すべて
  return /\/bills\/[^/]+\/interview(\/|$)/.test(pathname);
}

/**
 * 議案配下のページ（/[assembly]/bills/[key]/...、/preview/[assembly]/bills/[key]/...）から
 * 議会のスラッグと議案のキーを取り出す
 */
export function extractBillRouteFromPath(
  pathname: string
): { assemblySlug: string; billKey: string } | null {
  const match = pathname.match(/^(?:\/preview)?\/([^/]+)\/bills\/([^/]+)/);
  if (!match) return null;
  return {
    assemblySlug: decodeURIComponent(match[1]),
    billKey: decodeURIComponent(match[2]),
  };
}
