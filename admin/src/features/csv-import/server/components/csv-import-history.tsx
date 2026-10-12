import { CSV_IMPORT_KIND_LABELS } from "@mirai-gikai/shared/csv-import/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CsvImportJobSummary } from "../../shared/types";

const STATUS_LABELS: Record<CsvImportJobSummary["status"], string> = {
  validated: "確認待ち",
  committed: "取り込み済み",
  failed: "エラー",
  cancelled: "取り消し",
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** 取り込みの履歴（新しい順） */
export function CsvImportHistory({ jobs }: { jobs: CsvImportJobSummary[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">取り込みの履歴</h2>
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-500">まだ取り込みはありません</p>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>種類</TableHead>
                <TableHead>ファイル</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">新規</TableHead>
                <TableHead className="text-right">更新</TableHead>
                <TableHead className="text-right">エラー</TableHead>
                <TableHead>実行した人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="whitespace-nowrap text-gray-600">
                    {formatDateTime(job.committedAt ?? job.createdAt)}
                  </TableCell>
                  <TableCell>{CSV_IMPORT_KIND_LABELS[job.kind]}</TableCell>
                  <TableCell className="max-w-[240px] truncate">
                    {job.fileName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        job.status === "committed"
                          ? "default"
                          : job.status === "failed"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {STATUS_LABELS[job.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {job.insertCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.updateCount}
                  </TableCell>
                  <TableCell className="text-right">{job.errorCount}</TableCell>
                  <TableCell className="text-gray-600">
                    {job.createdByEmail}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
