import { BILL_CATEGORY_LABELS } from "@mirai-gikai/shared/bills/labels";
import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routes } from "@/lib/routes";
import { BillActionsMenu } from "../../../client/components/bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "../../../client/components/bill-list/preview-button";
import { PublishStatusBadge } from "../../../client/components/bill-list/publish-status-badge";
import { ViewButton } from "../../../client/components/bill-list/view-button";
import { BILL_STATUS_CONFIG } from "../../../shared/constants/bill-config";
import type {
  BillSortConfig,
  BillStatus,
  BillWithSession,
} from "../../../shared/types";
import { getBillStatusLabel } from "../../../shared/types";
import { getBills } from "../../loaders/get-bills";

function StatusBadge({ status }: { status: BillStatus }) {
  const config = BILL_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 py-1 rounded-full text-sm font-bold">
      <Icon className="h-4 w-4" />
      <span>{getBillStatusLabel(status)}</span>
    </div>
  );
}

export async function BillList({
  assemblySlug,
  assemblyId,
  sortConfig,
}: {
  assemblySlug: string;
  assemblyId: string;
  sortConfig: BillSortConfig;
}) {
  const bills = await getBills(assemblyId, sortConfig);

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-600">{bills.length}件の議案</div>
        <Link href={routes.assemblyBillNew(assemblySlug) as Route}>
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>議案</TableHead>
              <TableHead>会期</TableHead>
              <TableHead>種類</TableHead>
              <SortableTableHead
                field="publish_status_order"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                公開ステータス
              </SortableTableHead>
              <SortableTableHead
                field="status_order"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                審議ステータス
              </SortableTableHead>
              <SortableTableHead
                field="submitted_date"
                currentField={sortConfig.field}
                currentOrder={sortConfig.order}
              >
                提出日
              </SortableTableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <BillRow key={bill.id} assemblySlug={assemblySlug} bill={bill} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BillRow({
  assemblySlug,
  bill,
}: {
  assemblySlug: string;
  bill: BillWithSession;
}) {
  return (
    <TableRow>
      <TableCell className="max-w-[400px]">
        <Link
          href={routes.billEdit(bill.id) as Route}
          className="block truncate font-medium hover:underline"
        >
          {bill.name}
        </Link>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{bill.bill_number}</span>
          {bill.publish_level === "explained" && (
            <Badge variant="outline">解説あり</Badge>
          )}
          {bill.is_dummy && <Badge variant="secondary">ダミー</Badge>}
        </div>
      </TableCell>
      <TableCell className="text-gray-600">
        {bill.session?.name ?? "-"}
      </TableCell>
      <TableCell className="text-gray-600">
        {BILL_CATEGORY_LABELS[bill.category]}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <PublishStatusBadge
            billId={bill.id}
            publishStatus={bill.publish_status}
          />
          {(bill.publish_status === "draft" ||
            bill.publish_status === "coming_soon") && (
            <PreviewButton billId={bill.id} />
          )}
          {bill.publish_status === "published" && (
            <ViewButton
              assemblySlug={assemblySlug}
              billKey={bill.slug ?? bill.id}
            />
          )}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={bill.status} />
      </TableCell>
      <TableCell className="text-gray-600">
        {bill.submitted_date
          ? new Date(bill.submitted_date).toLocaleDateString("ja-JP", {
              timeZone: "Asia/Tokyo",
            })
          : "-"}
      </TableCell>
      <TableCell>
        <BillActionsMenu billId={bill.id} billName={bill.name} />
      </TableCell>
    </TableRow>
  );
}
