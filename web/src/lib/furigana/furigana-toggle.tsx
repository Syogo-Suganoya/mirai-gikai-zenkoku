"use client";

import { Switch } from "@/components/ui/switch";
import { useFuriganaToggle } from "./use-furigana-toggle";

interface FuriganaToggleProps {
  className?: string;
}

/** ふりがな表示のスイッチ（ヘッダーのメニュー） */
export function FuriganaToggle({ className }: FuriganaToggleProps) {
  const { enabled, toggle } = useFuriganaToggle();

  return (
    <div className={`flex items-center justify-between space-x-4 ${className}`}>
      <div className="space-y-0.5">
        <div className="text-sm font-medium">ふりがな表示</div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        aria-label="ふりがな表示の切り替え"
      />
    </div>
  );
}
