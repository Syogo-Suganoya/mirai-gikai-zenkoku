/**
 * 議会のスラッグに使えない名前。
 * 公開サイト（web）も管理画面（admin）も議会ごとのページを `/[assembly]/...` にしているので、
 * どちらかの固定のページ（`/cities`・`/tags` など）と同じ名前の議会を作ると開けなくなる。
 * どちらかにトップレベルのページを足したら、ここにも足す（各アプリの routes のテストが確かめる）。
 */
export const RESERVED_ASSEMBLY_SLUGS = [
  // web
  "api",
  "cities",
  "dev",
  "developers",
  "preview",
  "privacy",
  "report",
  "terms",
  "towns",
  // admin
  "account",
  "admins",
  "assemblies",
  "bills",
  "experts",
  "interview-opinion-backfill",
  "interviews",
  "login",
  "tags",
  "user-topic-analysis",
] as const;

export function isReservedAssemblySlug(slug: string): boolean {
  return (RESERVED_ASSEMBLY_SLUGS as readonly string[]).includes(slug);
}
