import type { Tx } from "@mirai-gikai/db";
import { tags } from "@mirai-gikai/db/schema";

/**
 * 全議会共通のタグ。featured_priority があるものは議会トップのカテゴリタブに出る。
 * 愛知県議会の解説付き議案のタグ（移行元のタグから絵文字を除いたもの）を含む。
 */
export const SEED_TAGS: Array<{
  label: string;
  featured_priority: number | null;
  description: string | null;
}> = [
  { label: "財政", featured_priority: 1, description: "予算やお金の使いみちに関する議案" },
  { label: "子育て・教育", featured_priority: 2, description: "子育てや学校・教育に関する議案" },
  { label: "医療・福祉", featured_priority: 3, description: "医療や介護・福祉に関する議案" },
  { label: "産業・しごと", featured_priority: 4, description: "産業の振興や働き方に関する議案" },
  { label: "暮らし・まちづくり", featured_priority: 5, description: "暮らしやまちづくりに関する議案" },
  { label: "防災", featured_priority: 6, description: "災害への備えに関する議案" },
  { label: "観光", featured_priority: null, description: null },
  { label: "補正予算", featured_priority: null, description: null },
  { label: "新設条例", featured_priority: null, description: null },
  { label: "産業振興", featured_priority: null, description: null },
  { label: "労働", featured_priority: null, description: null },
  { label: "組織改革", featured_priority: null, description: null },
  { label: "教育", featured_priority: null, description: null },
];

export async function seedTags(tx: Tx) {
  await tx.insert(tags).values(SEED_TAGS).onConflictDoNothing();
}
