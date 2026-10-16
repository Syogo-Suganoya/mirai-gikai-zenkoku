/**
 * 議案の出典として出すリンク。議案の原文（source_url）を優先し、
 * なければ議会のサイトの資料（議案の一覧・議決結果など。materials_url）を出す。
 */
export type BillSourceLink = {
  href: string;
  /** original: 議案の原文 / materials: 議会のサイトの資料 */
  kind: "original" | "materials";
  label: string;
};

export const BILL_SOURCE_LINK_LABELS: Record<BillSourceLink["kind"], string> = {
  original: "議案の原文（議会のサイト）",
  materials: "議会のサイトの資料",
};

export function billSourceLink(bill: {
  source_url: string | null;
  materials_url: string | null;
}): BillSourceLink | null {
  if (bill.source_url) {
    return {
      href: bill.source_url,
      kind: "original",
      label: BILL_SOURCE_LINK_LABELS.original,
    };
  }
  if (bill.materials_url) {
    return {
      href: bill.materials_url,
      kind: "materials",
      label: BILL_SOURCE_LINK_LABELS.materials,
    };
  }
  return null;
}
