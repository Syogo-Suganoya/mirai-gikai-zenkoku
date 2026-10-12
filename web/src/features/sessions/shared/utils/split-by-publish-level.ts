type PublishLevelLike = { publish_level: "title_only" | "explained" };

/**
 * 議案を「解説付き」と「件名のみ」に分ける。並びはそれぞれ元の順のまま。
 * 議会トップ・会期ページで、解説付きを上に、件名のみをまとめて下に出すのに使う。
 */
export function splitByPublishLevel<T extends PublishLevelLike>(
  bills: readonly T[]
): { explained: T[]; titleOnly: T[] } {
  const explained: T[] = [];
  const titleOnly: T[] = [];
  for (const bill of bills) {
    (bill.publish_level === "explained" ? explained : titleOnly).push(bill);
  }
  return { explained, titleOnly };
}
