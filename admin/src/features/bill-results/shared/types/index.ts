import type {
  BillResultValue,
  FactionVoteValue,
} from "@mirai-gikai/shared/bill-results/save";
import type {
  BillResult,
  FactionVote,
} from "@mirai-gikai/shared/csv-import/types";

export type { BillResultValue, FactionVoteValue };

/** 議会の会派（議決日の時点で有効なものを選ぶのに使う） */
export type FactionOption = {
  id: string;
  name: string;
  short_name: string | null;
  valid_from: string;
  valid_to: string | null;
};

/** 保存済みの議決結果（無ければ null） */
export type SavedBillResult = BillResultValue & {
  faction_votes: FactionVoteValue[];
};

/** 入力欄の値（未入力は空文字） */
export type BillResultFormValues = {
  result: BillResult | "";
  decided_on: string;
  yes_count: string;
  no_count: string;
  source_url: string;
  /** 会派 ID → 賛否（未入力は空文字） */
  faction_votes: Record<string, FactionVote | "">;
};
