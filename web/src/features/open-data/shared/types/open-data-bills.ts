import type {
  BillCategoryEnum,
  BillPublishLevel,
  BillResultEnum,
  BillStatusEnum,
  StanceTypeEnum,
} from "@/features/bills/shared/types";

export type OpenDataMiraiStance = {
  /** 賛否の種別（for / against など） */
  type: StanceTypeEnum;
  /** 賛否種別の日本語ラベル（賛成 / 反対 など） */
  label: string;
  /** 賛否についての補足コメント */
  comment: string | null;
};

export type OpenDataBillTag = {
  id: string;
  label: string;
};

export type OpenDataBillResult = {
  /** 議決結果（可決・否決など） */
  result: BillResultEnum;
  /** 議決結果の日本語ラベル */
  label: string;
  /** 議決日 */
  decidedOn: string | null;
};

export type OpenDataBillItem = {
  billId: string;
  /** 議会のスラッグ（URL の /[assembly]） */
  assemblySlug: string;
  /** 議会名（愛知県議会 など） */
  assemblyName: string;
  /** 議案番号（第1号議案 など） */
  billNumber: string;
  /** 件名 */
  name: string;
  /** 議案の種類（予算・条例 など） */
  category: BillCategoryEnum;
  /** 議案の種類の日本語ラベル */
  categoryLabel: string;
  /** 掲載の段階（title_only: 件名のみ / explained: 解説付き） */
  publishLevel: BillPublishLevel;
  /** わかりやすいタイトル（難易度別コンテンツ由来。解説がなければ件名） */
  title: string;
  /** 議案の概要（難易度別コンテンツ由来。解説がなければ空文字） */
  summary: string;
  status: BillStatusEnum;
  /** 審議状況の日本語ラベル（委員会で審査中 / 可決 など） */
  statusLabel: string;
  statusNote: string | null;
  /** 議決結果。まだ議決していなければ null */
  result: OpenDataBillResult | null;
  submittedDate: string | null;
  publishedAt: string | null;
  tags: OpenDataBillTag[];
  /** チームみらいの賛否。未表明の場合は null */
  miraiStance: OpenDataMiraiStance | null;
  createdAt: string;
};

export type OpenDataBillsResult = {
  items: OpenDataBillItem[];
  nextCursor: string | null;
};

export type OpenDataBillDetail = OpenDataBillItem & {
  /** 議案の本文解説（Markdown、難易度別コンテンツ由来。解説がなければ空文字） */
  content: string;
};
