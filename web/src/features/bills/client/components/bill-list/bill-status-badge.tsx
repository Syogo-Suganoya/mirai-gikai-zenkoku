import { Badge } from "@/components/ui/badge";
import type { BillResultEnum, BillStatusEnum } from "../../../shared/types";
import {
  getCardStatusLabel,
  getStatusVariant,
} from "../../../shared/utils/bill-status";

interface BillStatusBadgeProps {
  status: BillStatusEnum;
  /** 議決済みの議案の結果（可決・否決などで表示を変える） */
  result?: BillResultEnum | null;
  className?: string;
}

export function BillStatusBadge({
  status,
  result,
  className,
}: BillStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status, result)} className={className}>
      {getCardStatusLabel(status, result)}
    </Badge>
  );
}
