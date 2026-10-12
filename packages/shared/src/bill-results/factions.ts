/** 会派の有効期間（valid_from〜valid_to。valid_to が null なら現在も有効） */
export type FactionPeriod = {
  valid_from: string;
  valid_to: string | null;
};

/** 今日の日付（日本時間、YYYY-MM-DD） */
export function todayInJapan(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

/** その日（YYYY-MM-DD）に会派が有効か */
export function isFactionActiveOn(faction: FactionPeriod, on: string): boolean {
  return (
    faction.valid_from <= on &&
    (faction.valid_to === null || on <= faction.valid_to)
  );
}

/** その日に有効な会派だけを、元の並び順のまま返す */
export function factionsActiveOn<T extends FactionPeriod>(
  factions: readonly T[],
  on: string
): T[] {
  return factions.filter((f) => isFactionActiveOn(f, on));
}
