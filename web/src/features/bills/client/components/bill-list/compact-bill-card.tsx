import Image from "next/image";
import { Card } from "@/components/ui/card";
import { FuriganaText } from "@/lib/furigana/furigana-text";
import { formatDateWithDots } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { ReviewCompleteBadge } from "../bill-detail/review-status-banner";
import { BillMeta } from "./bill-meta";
import { BillStatusBadge } from "./bill-status-badge";
import { DummyBadge } from "./dummy-badge";

interface CompactBillCardProps {
  bill: BillWithContent;
  className?: string;
}

/**
 * コンパクトな水平レイアウトの議案カード
 * 会期ごとの議案一覧や、件名と原文のみの議案の一覧で使用
 */
export function CompactBillCard({ bill, className }: CompactBillCardProps) {
  const displayTitle = bill.bill_content?.title ?? (
    <FuriganaText segments={bill.name_furigana} text={bill.name} />
  );

  return (
    <Card
      className={`border border-black shadow-none hover:bg-muted/50 transition-colors overflow-hidden ${className ?? ""}`}
    >
      <div className="flex">
        {/* コンテンツエリア */}
        <div className="flex-1 p-4 flex flex-col gap-2">
          <BillMeta bill={bill} />
          <h3 className="font-bold text-[15px] leading-[1.6] line-clamp-2">
            {bill.is_dummy && <DummyBadge className="mr-1.5 align-middle" />}
            {displayTitle}
            {bill.is_review_completed && (
              <>
                {" "}
                <ReviewCompleteBadge size={14} top="1px" />
              </>
            )}
          </h3>
          <div className="flex items-center gap-3">
            <BillStatusBadge
              status={bill.status}
              result={bill.bill_result?.result}
              className="w-fit"
            />
            {bill.bill_result?.decided_on ? (
              <span className="text-xs text-muted-foreground">
                {formatDateWithDots(bill.bill_result.decided_on)} 議決
              </span>
            ) : (
              bill.submitted_date && (
                <span className="text-xs text-muted-foreground">
                  {formatDateWithDots(bill.submitted_date)} 提出
                </span>
              )
            )}
          </div>
        </div>

        {/* サムネイル画像 */}
        {bill.thumbnail_url && (
          <div className="relative w-24 h-16 flex-shrink-0 self-center mr-4 rounded-lg overflow-hidden">
            <Image
              src={bill.thumbnail_url}
              alt={bill.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
