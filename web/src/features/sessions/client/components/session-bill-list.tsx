"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";
import type { BillWithContent } from "@/features/bills/shared/types";
import { billDetailHref } from "@/features/bills/shared/utils/bill-href";
import {
  BILL_STATUS_GROUP_LABELS,
  BILL_STATUS_GROUPS,
  type BillStatusGroup,
  countByStatusGroup,
  filterByStatusGroup,
} from "@/features/bills/shared/utils/bill-status-group";
import { splitByPublishLevel } from "../../shared/utils/split-by-publish-level";

type Props = {
  bills: BillWithContent[];
};

/**
 * 会期の議案一覧。審議の状況（審議中・可決・否決・継続）で絞り込める。
 * 解説付きの議案を上に、件名のみの議案はその下にまとめて出す。
 */
export function SessionBillList({ bills }: Props) {
  const [activeGroup, setActiveGroup] = useState<BillStatusGroup>("all");
  const counts = countByStatusGroup(bills);
  const { explained, titleOnly } = splitByPublishLevel(
    filterByStatusGroup(bills, activeGroup)
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 絞り込みボタン（0件のグループは出さない。「すべて」は常に出す） */}
      <div className="flex flex-wrap gap-3">
        {BILL_STATUS_GROUPS.filter(
          (group) => group === "all" || counts[group] > 0
        ).map((group) => (
          <Button
            key={group}
            variant="ghost"
            onClick={() => setActiveGroup(group)}
            aria-pressed={activeGroup === group}
            className={`h-[29px] px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              activeGroup === group
                ? "bg-mirai-gradient text-black hover:bg-mirai-gradient"
                : "bg-mirai-surface-grouped text-mirai-text-muted hover:bg-mirai-surface-muted"
            }`}
          >
            {BILL_STATUS_GROUP_LABELS[group]} {counts[group]}
          </Button>
        ))}
      </div>

      {explained.length === 0 && titleOnly.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          該当する議案がありません
        </p>
      ) : (
        <>
          <BillCards bills={explained} />
          {titleOnly.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-[15px] font-bold text-mirai-text-secondary">
                件名のみの議案 {titleOnly.length}件
              </h3>
              <BillCards bills={titleOnly} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BillCards({ bills }: { bills: BillWithContent[] }) {
  if (bills.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {bills.map((bill) => (
        <Link key={bill.id} href={billDetailHref(bill)}>
          <CompactBillCard bill={bill} />
        </Link>
      ))}
    </div>
  );
}
