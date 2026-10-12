import {
  CheckCircle,
  Clock,
  FileText,
  PauseCircle,
  Settings,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";

import type { BillStatus } from "../types";

// ステータスの表示設定（一覧画面で使用）
export const BILL_STATUS_CONFIG: Record<
  BillStatus,
  { icon: ElementType; color: string }
> = {
  preparing: {
    icon: Settings,
    color: "text-gray-600 bg-gray-50",
  },
  introduced: {
    icon: FileText,
    color: "text-blue-600 bg-blue-50",
  },
  referred_to_committee: {
    icon: Clock,
    color: "text-yellow-600 bg-yellow-50",
  },
  decided: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-50",
  },
  continued: {
    icon: PauseCircle,
    color: "text-orange-600 bg-orange-50",
  },
  withdrawn: {
    icon: XCircle,
    color: "text-gray-500 bg-gray-50",
  },
};
