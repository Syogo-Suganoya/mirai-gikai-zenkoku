"use client";

import {
  ASSEMBLY_KIND_LABELS,
  type AssemblyKind,
} from "@mirai-gikai/shared/assemblies/assembly-kind";
import { Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { filterAssemblies } from "../../shared/utils/filter-assemblies";

const STATUS_LABELS: Record<AssemblyListItem["status"], string> = {
  master_only: "未着手",
  preparing: "準備中",
  public: "公開中",
};

/**
 * 1つの区分（都道府県・市・区町村。ヘッダーで切り替える）の議会の一覧。
 * 都道府県コード順に並べ、議会名・都道府県名で探せる。行のどこを押しても、その議会の議案一覧を開く。
 */
export function AssemblyList({
  assemblies,
  kind,
}: {
  assemblies: AssemblyListItem[];
  kind: AssemblyKind;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const visible = filterAssemblies(assemblies, { kind, query });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="議会名・都道府県名で探す"
            aria-label="議会名・都道府県名で探す"
            className="pl-8"
          />
        </div>
      </div>

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
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-gray-500"
                >
                  {query.trim()
                    ? `「${query.trim()}」に当たる${ASSEMBLY_KIND_LABELS[kind]}の議会はありません`
                    : `${ASSEMBLY_KIND_LABELS[kind]}の議会はまだありません`}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((assembly) => {
                const href = routes.assemblyBills(assembly.slug) as Route;
                return (
                  <TableRow
                    key={assembly.id}
                    onClick={() => router.push(href)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      {/* キーボードで開けるようにリンクも残す（行のクリックと同じ先） */}
                      <Link
                        href={href}
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium hover:underline"
                      >
                        {assembly.name}
                      </Link>
                    </TableCell>
                    <TableCell>{STATUS_LABELS[assembly.status]}</TableCell>
                    <TableCell className="text-right">
                      {assembly.billCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {assembly.publishedBillCount}
                    </TableCell>
                    <TableCell>
                      {assembly.dummyBillCount > 0 && (
                        <Badge variant="secondary">ダミー</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
