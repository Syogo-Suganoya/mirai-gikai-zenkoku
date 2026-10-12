import type {
  Bill,
  BillContent,
  BillResultRow,
  BillTag,
  BillWithContent,
} from "../types";

/** リポジトリが返す議案の行（関連を含む） */
export type BillRowWithRelations = Bill & {
  assembly: { slug: string };
  bill_contents?: BillContent[];
  bills_tags?: Array<{ tags: BillTag | null }>;
  bill_result?: BillResultRow | null;
};

/**
 * 議案の行を画面で使う形（BillWithContent）にする。
 * 解説は指定した難易度の1件（件名と原文のみの議案は undefined）、タグは配列にする。
 */
export function toBillWithContent(
  row: BillRowWithRelations,
  extra: Partial<Pick<BillWithContent, "hasPublicInterview" | "tags">> = {}
): BillWithContent {
  const { assembly, bill_contents, bills_tags, bill_result, ...bill } = row;
  return {
    ...bill,
    assembly_slug: assembly.slug,
    bill_content: bill_contents?.[0],
    tags:
      extra.tags ??
      (bills_tags ?? [])
        .map((link) => link.tags)
        .filter((tag): tag is BillTag => tag !== null),
    bill_result: bill_result ?? undefined,
    hasPublicInterview: extra.hasPublicInterview,
  };
}
