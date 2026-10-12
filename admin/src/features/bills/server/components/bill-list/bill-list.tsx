import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loadSessions } from "@/features/sessions/server/loaders/load-sessions";
import { routes } from "@/lib/routes";
import { BillListFilters } from "../../../client/components/bill-list/bill-list-filters";
import { BillListTable } from "../../../client/components/bill-list/bill-list-table";
import type { BillSortConfig } from "../../../shared/types";
import {
  type BillListFilter,
  filterBills,
} from "../../../shared/utils/bill-list-filter";
import { getBills } from "../../loaders/get-bills";

export async function BillList({
  assemblySlug,
  assemblyId,
  sortConfig,
  filter,
  canReview,
  isSuperAdmin,
}: {
  assemblySlug: string;
  assemblyId: string;
  sortConfig: BillSortConfig;
  filter: BillListFilter;
  /** 確認者以上か（「解説あり」の議案をまとめて公開できるか） */
  canReview: boolean;
  /** 全体管理者か（インタビュー・トピック分析のメニューを出すか） */
  isSuperAdmin: boolean;
}) {
  const [allBills, sessions] = await Promise.all([
    getBills(assemblyId, sortConfig),
    loadSessions(assemblyId),
  ]);
  const bills = filterBills(allBills, filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <BillListFilters
          assemblySlug={assemblySlug}
          filter={filter}
          sessions={sessions.map((s) => ({ id: s.id, name: s.name }))}
        />
        <Link href={routes.assemblyBillNew(assemblySlug) as Route}>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </Link>
      </div>
      <div className="text-sm text-gray-600">
        {bills.length === allBills.length
          ? `${bills.length}件の議案`
          : `${allBills.length}件中 ${bills.length}件を表示`}
      </div>

      <BillListTable
        assemblySlug={assemblySlug}
        bills={bills}
        sortConfig={sortConfig}
        canReview={canReview}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
