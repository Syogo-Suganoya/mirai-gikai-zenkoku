import {
  SITE_NAME_LOCAL_PART,
  SITE_NAME_MAIN_PART,
} from "@mirai-gikai/shared/site/site-name";
import { Landmark } from "lucide-react";

/**
 * ロゴ（マーク＋サービス名＋「非公式」＋「管理画面」）。
 * 公開サイトのロゴ（web/src/components/brand/site-logo.tsx）と同じ見た目にする。
 */
export function SiteLogo() {
  return (
    <span className="flex items-center gap-2">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand text-white"
        aria-hidden
      >
        <Landmark className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1.5">
          <span className="whitespace-nowrap text-[15px] font-extrabold tracking-wide text-gray-900">
            {SITE_NAME_MAIN_PART}
          </span>
          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-bold leading-none text-gray-600">
            非公式
          </span>
          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold leading-none text-white">
            管理画面
          </span>
        </span>
        <span className="whitespace-nowrap text-[11px] font-bold text-brand-accent">
          {SITE_NAME_LOCAL_PART}
        </span>
      </span>
    </span>
  );
}
