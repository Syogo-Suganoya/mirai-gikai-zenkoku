import { Landmark } from "lucide-react";
import { SITE_NAME_LOCAL_PART, SITE_NAME_MAIN_PART } from "@/config/site";

/**
 * サイト独自のロゴマーク（議事堂のアイコン）。
 * チームみらいのロゴは使わない（FORK_GUIDELINES.md 2.）。
 */
export function SiteLogoMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const box = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" }[size];
  const icon = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" }[size];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl bg-primary text-white ${box}`}
      aria-hidden
    >
      <Landmark className={icon} strokeWidth={2.2} />
    </span>
  );
}

/** 非公式のサイトであることを示すラベル */
export function UnofficialLabel({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-mirai-border bg-white px-2 py-0.5 text-[10px] font-bold leading-none text-mirai-text-secondary ${className ?? ""}`}
    >
      非公式
    </span>
  );
}

/**
 * ロゴ（マーク＋サービス名＋「非公式」）。ヘッダーとフッターで使う。
 * 本家「みらい議会」と見分けられるよう、地域名の部分とラベルを必ず並べる。
 */
export function SiteLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <SiteLogoMark size={compact ? "sm" : "md"} />
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-wide text-mirai-text ${compact ? "text-[15px]" : "text-lg"}`}
          >
            {SITE_NAME_MAIN_PART}
          </span>
          <UnofficialLabel />
        </span>
        <span
          className={`font-bold text-primary-accent ${compact ? "text-[11px]" : "text-[13px]"}`}
        >
          {SITE_NAME_LOCAL_PART}
        </span>
      </span>
    </span>
  );
}
