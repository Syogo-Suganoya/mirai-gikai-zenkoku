"use client";

import { BILL_PUBLISH_LEVEL_LABELS } from "@mirai-gikai/shared/bills/labels";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { routes } from "@/lib/routes";
import {
  BILL_DATA_KIND_LABELS,
  BILL_PUBLISH_STATUS_LABELS,
  type BillListFilter,
  isFilterActive,
} from "../../../shared/utils/bill-list-filter";

/** Select は空文字の値を持てないので「すべて」を表す値 */
const ALL = "all";

interface BillListFiltersProps {
  assemblySlug: string;
  filter: BillListFilter;
  sessions: { id: string; name: string }[];
}

/** 議案一覧の絞り込み（会期・公開状態・掲載のしかた）。URL に持つので並び替えと両立する */
export function BillListFilters({
  assemblySlug,
  filter,
  sessions,
}: BillListFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (
    key: "session" | "publish" | "level" | "data",
    value: string
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    const base = routes.assemblyBills(assemblySlug);
    router.push((query ? `${base}?${query}` : base) as Route);
  };

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["session", "publish", "level", "data"])
      params.delete(key);
    const query = params.toString();
    const base = routes.assemblyBills(assemblySlug);
    router.push((query ? `${base}?${query}` : base) as Route);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filter.sessionId ?? ALL}
        onValueChange={(value) => update("session", value)}
      >
        <SelectTrigger className="w-48" aria-label="会期">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべての会期</SelectItem>
          {sessions.map((session) => (
            <SelectItem key={session.id} value={session.id}>
              {session.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.publishStatus ?? ALL}
        onValueChange={(value) => update("publish", value)}
      >
        <SelectTrigger className="w-40" aria-label="公開状態">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべての公開状態</SelectItem>
          {Object.entries(BILL_PUBLISH_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.publishLevel ?? ALL}
        onValueChange={(value) => update("level", value)}
      >
        <SelectTrigger className="w-40" aria-label="掲載のしかた">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>すべての掲載</SelectItem>
          {Object.entries(BILL_PUBLISH_LEVEL_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.dataKind ?? ALL}
        onValueChange={(value) => update("data", value)}
      >
        <SelectTrigger className="w-40" aria-label="ダミー">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>実データとダミー</SelectItem>
          {Object.entries(BILL_DATA_KIND_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isFilterActive(filter) && (
        <Button variant="ghost" size="sm" onClick={clear}>
          絞り込みを解除
        </Button>
      )}
    </div>
  );
}
