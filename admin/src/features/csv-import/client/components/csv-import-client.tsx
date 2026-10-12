"use client";

import {
  CSV_COLUMNS,
  toCsvText,
} from "@mirai-gikai/shared/csv-import/templates";
import { CSV_IMPORT_KIND_LABELS } from "@mirai-gikai/shared/csv-import/types";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DummyDeletionDialog } from "@/features/assemblies/client/components/dummy-deletion-dialog";
import type {
  CsvImportActions,
  CsvImportKind,
  CsvIssue,
  CsvPreview,
  CsvPreviewRow,
} from "../../shared/types";
import {
  issuesToCsvRows,
  PREVIEW_ROW_LIMIT,
} from "../../shared/utils/build-csv-preview";

const KIND_DESCRIPTIONS: Record<CsvImportKind, string> = {
  assemblies:
    "議会そのもの（議会名・種類・都道府県・公式サイト）。目印は団体コード。新しい議会は設定を既定のまま作ります",
  bills:
    "会期ごとの議案一覧。目印は「会期キー × 議案番号」。新しい議案は下書きで入ります",
  results:
    "閉会後の議決結果一覧表。会派名をそのまま列の見出しにすると、会派ごとの賛否も入ります",
  sessions: "年度初めに1年分の定例会などを入れるとき。目印は会期キー",
  factions: "改選・会派の再編のとき。目印は「会派名 × 有効開始日」",
};

function downloadCsv(fileName: string, rows: string[][]) {
  const blob = new Blob([`﻿${toCsvText(rows)}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV 取り込み（種類の選択 → ファイル → 確認 → 確定）。議会の取り込みと議会マスタの取り込みで使う。
 * Server Action は呼び出し側で議会を束ねて渡す（actions）。
 */
export function CsvImportClient({
  assemblyName,
  kinds,
  templateHref,
  actions,
}: {
  /** ダミー削除の確認に出す議会名（議会マスタの取り込みでは null） */
  assemblyName: string | null;
  /** この人が取り込める種類 */
  kinds: CsvImportKind[];
  /** テンプレート CSV の URL（?kind= を足して使う） */
  templateHref: string;
  actions: CsvImportActions;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<CsvImportKind>(kinds[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmingDummy, setConfirmingDummy] = useState(false);
  // 選び直したときにドロップ欄を作り直すためのキー
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const reset = () => {
    setPreview(null);
    setFile(null);
    setDropzoneKey((k) => k + 1);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);
      const result = await actions.upload(formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setPreview(result);
        router.refresh();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleCommit = async (deleteDummyData: boolean) => {
    if (!preview) return;
    setIsBusy(true);
    try {
      const result = await actions.commit(preview.jobId, { deleteDummyData });
      if ("needsDummyDeletion" in result) {
        setConfirmingDummy(true);
      } else if ("error" in result) {
        toast.error(result.error);
        reset();
        router.refresh();
      } else {
        toast.success(
          `取り込みました（新規 ${result.insertCount}件・更新 ${result.updateCount}件）`
        );
        reset();
        router.refresh();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancel = async () => {
    if (preview) await actions.cancel(preview.jobId);
    reset();
    router.refresh();
  };

  if (preview) {
    const canCommit =
      preview.errors.length === 0 &&
      preview.insertCount + preview.updateCount > 0;
    return (
      <div className="space-y-6 rounded-lg border bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold">
            確認：{CSV_IMPORT_KIND_LABELS[preview.kind]}（{preview.fileName}）
          </h2>
          <p className="text-sm text-gray-500">
            {preview.rowCount}行・文字コード {preview.encoding}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Count label="新規" value={preview.insertCount} />
          <Count label="更新" value={preview.updateCount} />
          <Count label="変化なし" value={preview.unchangedCount} />
          <Count
            label="エラー"
            value={preview.errors.length}
            danger={preview.errors.length > 0}
          />
        </div>

        {preview.warnings.length > 0 && (
          <IssueList title="注意" issues={preview.warnings} tone="warning" />
        )}

        {preview.errors.length > 0 && (
          <div className="space-y-2">
            <IssueList title="エラー" issues={preview.errors} tone="error" />
            <p className="text-sm text-red-700">
              エラーが1件でもあると取り込めません。直してから入れ直してください。
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  `エラー_${preview.fileName}`,
                  issuesToCsvRows(preview.errors)
                )
              }
            >
              <Download className="mr-1 h-4 w-4" />
              エラーの一覧をダウンロード
            </Button>
          </div>
        )}

        {preview.inserts.length > 0 && (
          <RowTable
            title={`新規（${preview.insertCount}件）`}
            rows={preview.inserts}
            total={preview.insertCount}
            kind={preview.kind}
          />
        )}
        {preview.updates.length > 0 && (
          <RowTable
            title={`更新（${preview.updateCount}件）`}
            rows={preview.updates}
            total={preview.updateCount}
            kind={preview.kind}
          />
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleCommit(false)}
            disabled={!canCommit || isBusy}
          >
            {isBusy ? "取り込み中..." : "取り込む"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isBusy}>
            やめる
          </Button>
          {canCommit && (
            <span className="text-sm text-gray-500">
              すべての行を1度に反映します（途中で失敗したら何も反映しません）
            </span>
          )}
        </div>

        <DummyDeletionDialog
          open={confirmingDummy}
          assemblyName={assemblyName ?? ""}
          actionLabel="この CSV を取り込みます"
          onCancel={() => setConfirmingDummy(false)}
          onConfirm={() => {
            setConfirmingDummy(false);
            handleCommit(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div className="grid gap-4 md:grid-cols-[240px_1fr] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="csv-kind">種類</Label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as CsvImportKind)}
          >
            <SelectTrigger id="csv-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {CSV_IMPORT_KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <a href={`${templateHref}?kind=${kind}`}>
              <Download className="mr-1 h-4 w-4" />
              テンプレート CSV
            </a>
          </Button>
          <p className="text-sm text-gray-500">{KIND_DESCRIPTIONS[kind]}</p>
        </div>
      </div>

      <Dropzone
        key={dropzoneKey}
        accept={{ "text/csv": [".csv"] }}
        onFilesAccepted={(files) => setFile(files[0] ?? null)}
        disabled={isBusy}
      />
      <p className="text-xs text-gray-500">
        Excel で保存した
        CSV（Shift_JIS）もそのまま読めます。見出しは日本語でも英語名でもかまいません。一度に
        5,000 行まで。
      </p>

      <Button onClick={handleUpload} disabled={!file || isBusy}>
        {isBusy ? "読み込み中..." : "読み込んで確認する"}
      </Button>
    </div>
  );
}

function Count({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${danger ? "border-red-200 bg-red-50" : ""}`}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={`text-2xl font-bold ${danger ? "text-red-700" : "text-gray-900"}`}
      >
        {value}
      </div>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: CsvIssue[];
  tone: "error" | "warning";
}) {
  return (
    <div
      className={`max-h-64 overflow-y-auto rounded-md border p-3 text-sm ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <p className="mb-1 font-semibold">{title}</p>
      <ul className="space-y-0.5">
        {issues.map((issue, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 同じ行・列に複数のエラーが出ることがある
          <li key={i}>
            {issue.row > 0 && `${issue.row}行目`}
            {issue.column && `（${issue.column}）`}：{issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowTable({
  title,
  rows,
  total,
  kind,
}: {
  title: string;
  rows: CsvPreviewRow[];
  total: number;
  kind: CsvPreview["kind"];
}) {
  const labels = Object.fromEntries(
    CSV_COLUMNS[kind].map((column) => [column.key, column.label])
  );
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <div className="max-h-96 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">行</TableHead>
              <TableHead>目印</TableHead>
              <TableHead>名前</TableHead>
              <TableHead>変更</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.row}>
                <TableCell className="text-gray-500">{row.row}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">
                  {row.key}
                </TableCell>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-xs">
                  {row.changes.map((change) => (
                    <div key={change.field}>
                      <span className="font-semibold">
                        {labels[change.field] ?? change.field}
                      </span>
                      ：
                      <span className="text-gray-500 line-through">
                        {change.before}
                      </span>
                      {" → "}
                      {change.after}
                    </div>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {total > rows.length && (
        <p className="text-xs text-gray-500">
          先頭の {PREVIEW_ROW_LIMIT} 件だけ表示しています（全 {total}{" "}
          件を取り込みます）
        </p>
      )}
    </div>
  );
}
