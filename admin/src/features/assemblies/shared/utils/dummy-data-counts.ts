/** 議会に残っているダミーデータの件数 */
export type DummyDataCounts = {
  sessions: number;
  bills: number;
  factions: number;
};

export function hasDummyCounts(counts: DummyDataCounts): boolean {
  return counts.sessions + counts.bills + counts.factions > 0;
}

/** 「会期1件・議案3件・会派3件」の形。0件のものは書かない */
export function describeDummyCounts(counts: DummyDataCounts): string {
  return [
    ["会期", counts.sessions],
    ["議案", counts.bills],
    ["会派", counts.factions],
  ]
    .filter(([, count]) => (count as number) > 0)
    .map(([label, count]) => `${label}${count}件`)
    .join("・");
}
