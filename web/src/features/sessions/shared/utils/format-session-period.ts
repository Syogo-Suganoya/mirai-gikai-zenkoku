/** YYYY-MM-DD を YYYY.MM.DD にする */
function dotted(date: string): string {
  return date.replaceAll("-", ".");
}

/**
 * 会期の期間を表示用にする（例: 2025.10.24〜12.17）。
 * 同じ年なら終了日の年を省き、年をまたぐときは終了日にも年を付ける。
 */
export function formatSessionPeriod(
  startDate: string,
  endDate: string
): string {
  const start = dotted(startDate);
  const end = dotted(endDate);
  if (startDate.slice(0, 4) === endDate.slice(0, 4)) {
    return `${start}〜${end.slice(5)}`;
  }
  return `${start}〜${end}`;
}
