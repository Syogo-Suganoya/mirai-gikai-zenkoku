"use client";

import { BILL_CATEGORY_LABELS } from "@mirai-gikai/shared/bills/labels";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { bulkUpdatePublishStatus } from "../../../server/actions/bulk-update-publish-status";
import { BILL_STATUS_CONFIG } from "../../../shared/constants/bill-config";
import type {
  BillPublishStatus,
  BillSortConfig,
  BillStatus,
  BillWithSession,
} from "../../../shared/types";
import { getBillStatusLabel } from "../../../shared/types";
import { planBulkPublishStatus } from "../../../shared/utils/plan-bulk-publish";
import { BillActionsMenu } from "../bill-actions-menu/bill-actions-menu";
import { PreviewButton } from "./preview-button";
import { PublishStatusBadge } from "./publish-status-badge";
import { ViewButton } from "./view-button";

interface BillListTableProps {
  assemblySlug: string;
  bills: BillWithSession[];
  sortConfig: BillSortConfig;
}

const BULK_ACTION_LABELS: Record<"published" | "draft", string> = {
  published: "公開",
  draft: "下書きに戻す",
};

/** 議案一覧の表。チェックした議案の公開状態をまとめて変えられる */
export function BillListTable({
  assemblySlug,
  bills,
  sortConfig,
}: BillListTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingStatus, setPendingStatus] = useState<
    "published" | "draft" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 絞り込みを変えても、表示中の議案だけを選択中として扱う
  const selected = bills.filter((bill) => selectedIds.has(bill.id));
  const allSelected = bills.length > 0 && selected.length === bills.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(bills.map((b) => b.id)) : new Set());
  const toggleOne = (billId: string, checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(billId);
      else next.delete(billId);
      return next;
    });

  const publishPlan = planBulkPublishStatus(selected, "published");
  const draftPlan = planBulkPublishStatus(selected, "draft");
  const pendingPlan = pendingStatus === "published" ? publishPlan : draftPlan;

  const runBulkUpdate = async (newStatus: BillPublishStatus) => {
    setIsSubmitting(true);
    try {
      const result = await bulkUpdatePublishStatus(
        assemblySlug,
        selected.map((bill) => bill.id),
        newStatus
      );
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${result.updatedCount}件の議案を${newStatus === "published" ? "公開しました" : "下書きに戻しました"}`
      );
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setIsSubmitting(false);
      setPendingStatus(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* 選んだときに表がずれないよう、選択前も同じ場所に出しておく */}
      <div className="flex min-h-12 flex-wrap items-center gap-3 rounded-md border bg-blue-50 px-4 py-2">
        {selected.length === 0 ? (
          <span className="text-sm text-gray-600">
            議案にチェックを入れると、まとめて公開・下書きに戻すができます
          </span>
        ) : (
          <>
            <span className="text-sm font-medium">
              {selected.length}件を選択中
            </span>
            <Button
              size="sm"
              disabled={isSubmitting || publishPlan.targetIds.length === 0}
              onClick={() => setPendingStatus("published")}
            >
              公開する
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting || draftPlan.targetIds.length === 0}
              onClick={() => setPendingStatus("draft")}
            >
              下書きに戻す
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              選択を解除
            </Button>
          </>
        )}
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="表示中の議案をすべて選ぶ"
                  disabled={bills.length === 0}
                />
              </TableHead>
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
            {bills.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-gray-500"
                >
                  該当する議案はありません
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <BillRow
                  key={bill.id}
                  assemblySlug={assemblySlug}
                  bill={bill}
                  checked={selectedIds.has(bill.id)}
                  onCheckedChange={(checked) => toggleOne(bill.id, checked)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && setPendingStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingPlan.targetIds.length}件の議案を
              {pendingStatus && BULK_ACTION_LABELS[pendingStatus]}しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === "published"
                ? "公開サイトに載ります。"
                : "公開サイトから外れます。"}
              {pendingPlan.unchangedCount > 0 &&
                `（選択中のうち${pendingPlan.unchangedCount}件はすでにその状態なので変わりません）`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                if (pendingStatus) runBulkUpdate(pendingStatus);
              }}
            >
              {isSubmitting
                ? "変更中..."
                : pendingStatus && BULK_ACTION_LABELS[pendingStatus]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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

function BillRow({
  assemblySlug,
  bill,
  checked,
  onCheckedChange,
}: {
  assemblySlug: string;
  bill: BillWithSession;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <TableRow data-state={checked ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-label={`${bill.name}を選ぶ`}
        />
      </TableCell>
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
