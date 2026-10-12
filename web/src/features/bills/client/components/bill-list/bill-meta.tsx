import type { BillWithContent } from "../../../shared/types";
import { BILL_CATEGORY_LABELS } from "../../../shared/types";

/** 議案番号・種類・付託委員会（地方議会の議案の基本情報） */
export function BillMeta({
  bill,
  className,
}: {
  bill: Pick<BillWithContent, "bill_number" | "category" | "committee_name">;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-mirai-text-subtle ${className ?? ""}`}
    >
      <span>{bill.bill_number}</span>
      <span aria-hidden>・</span>
      <span>{BILL_CATEGORY_LABELS[bill.category]}</span>
      {bill.committee_name && (
        <>
          <span aria-hidden>・</span>
          <span className="line-clamp-1">{bill.committee_name}</span>
        </>
      )}
    </div>
  );
}
