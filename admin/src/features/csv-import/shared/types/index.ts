import type {
  CsvImportKind,
  CsvIssue,
} from "@mirai-gikai/shared/csv-import/types";

export type { CsvImportKind, CsvIssue };

/** 取り込める種類（議会マスタは全体の画面で扱うので、議会の画面では出さない） */
export const ASSEMBLY_CSV_KINDS = [
  "bills",
  "results",
  "sessions",
  "factions",
] as const satisfies readonly CsvImportKind[];
export type AssemblyCsvKind = (typeof ASSEMBLY_CSV_KINDS)[number];

/** 取り込み画面の操作（議会の取り込みと議会マスタの取り込みで、Server Action を差し替える） */
export type CsvImportActions = {
  upload: (formData: FormData) => Promise<CsvPreview | { error: string }>;
  commit: (
    jobId: string,
    options: { deleteDummyData?: boolean }
  ) => Promise<CommitCsvResult>;
  cancel: (jobId: string) => Promise<void>;
};

export type CommitCsvResult =
  | { success: true; insertCount: number; updateCount: number }
  | { error: string }
  /** 議会にダミーデータが残っている。消してよいか確認してから deleteDummyData: true で送り直す */
  | { needsDummyDeletion: true };

/** 確認画面の1行 */
export type CsvPreviewRow = {
  row: number;
  /** 突き合わせの目印（例: 2026-09 議案第52号） */
  key: string;
  /** 一覧に出す名前（議案名・会期名など） */
  label: string;
  /** 更新のときの変更（新規・変化なしは空） */
  changes: { field: string; before: string; after: string }[];
};

/** 確認画面の内容（アップロード直後に返す） */
export type CsvPreview = {
  jobId: string;
  kind: CsvImportKind;
  fileName: string;
  encoding: string;
  rowCount: number;
  inserts: CsvPreviewRow[];
  updates: CsvPreviewRow[];
  unchangedCount: number;
  errors: CsvIssue[];
  warnings: CsvIssue[];
  /** 表示を切り詰めたか（件数は全体の数） */
  insertCount: number;
  updateCount: number;
};

/** 取り込みの履歴の1行 */
export type CsvImportJobSummary = {
  id: string;
  kind: CsvImportKind;
  fileName: string;
  status: "validated" | "committed" | "failed" | "cancelled";
  rowCount: number;
  insertCount: number;
  updateCount: number;
  errorCount: number;
  createdAt: string;
  committedAt: string | null;
  createdByEmail: string;
};
