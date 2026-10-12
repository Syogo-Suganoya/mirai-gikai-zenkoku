import "server-only";

import { TagChipLink } from "../../client/components/bill-list/tag-chip-link";
import type { BillCategoryCount } from "../../shared/utils/bill-category";
import {
  billsListHref,
  DEFAULT_BILLS_LIST_PARAMS,
} from "../../shared/utils/parse-bills-list-params";

/**
 * 議会トップの種類タブ（予算・条例・人事など）。
 * 各タブは `/[assembly]/bills` を種類で絞った状態にリンクする。
 * 地方議会の議案はテーマのタグより種類で探すことが多いので、カテゴリタブとは別に並べる。
 */
export function BillCategoryTabs({
  assemblySlug,
  counts,
}: {
  assemblySlug: string;
  counts: BillCategoryCount[];
}) {
  if (counts.length === 0) return null;

  return (
    <nav aria-label="議案の種類" className="flex items-center gap-2">
      <span className="shrink-0 text-xs font-bold text-mirai-text-secondary">
        種類
      </span>
      <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto">
        {counts.map((item) => (
          <TagChipLink
            key={item.category}
            href={billsListHref(assemblySlug, DEFAULT_BILLS_LIST_PARAMS, {
              category: item.category,
            })}
            label={item.label}
            count={item.count}
          />
        ))}
      </div>
    </nav>
  );
}
