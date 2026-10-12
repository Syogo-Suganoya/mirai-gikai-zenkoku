import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routes } from "@/lib/routes";
import type { AssemblyListItem } from "../../shared/types";

const STATUS_LABELS: Record<AssemblyListItem["status"], string> = {
  master_only: "未着手",
  preparing: "準備中",
  public: "公開中",
};

/** 議会の一覧（議案のある議会を上に並べる） */
export function AssemblyList({
  assemblies,
}: {
  assemblies: AssemblyListItem[];
}) {
  const sorted = [...assemblies].sort(
    (a, b) =>
      Number(b.billCount - b.dummyBillCount > 0) -
        Number(a.billCount - a.dummyBillCount > 0) ||
      Number(b.billCount > 0) - Number(a.billCount > 0)
  );

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>議会</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="text-right">議案</TableHead>
            <TableHead className="text-right">公開中</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((assembly) => (
            <TableRow key={assembly.id}>
              <TableCell>
                <Link
                  href={routes.assemblyBills(assembly.slug) as Route}
                  className="font-medium hover:underline"
                >
                  {assembly.name}
                </Link>
                <div className="font-mono text-xs text-gray-500">
                  {assembly.slug}
                </div>
              </TableCell>
              <TableCell>{STATUS_LABELS[assembly.status]}</TableCell>
              <TableCell className="text-right">{assembly.billCount}</TableCell>
              <TableCell className="text-right">
                {assembly.publishedBillCount}
              </TableCell>
              <TableCell>
                {assembly.dummyBillCount > 0 && (
                  <Badge variant="secondary">ダミー</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
