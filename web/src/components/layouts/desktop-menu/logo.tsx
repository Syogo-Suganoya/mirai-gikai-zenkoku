import Link from "next/link";
import { SiteLogoMark, UnofficialLabel } from "@/components/brand/site-logo";
import {
  SITE_NAME,
  SITE_NAME_LOCAL_PART,
  SITE_NAME_MAIN_PART,
} from "@/config/site";
import { routes } from "@/lib/routes";

/**
 * デスクトップメニュー: ロゴ (画面左上)
 * チームみらいのロゴは使わず、独自のマークと「非公式」の表示を出す。
 */
export function DesktopMenuLogo() {
  return (
    <Link
      href={routes.home()}
      aria-label={`${SITE_NAME}（非公式） ホーム`}
      className="fixed top-6 left-6 z-50 flex items-center gap-4 hover:opacity-90 transition-opacity"
    >
      <SiteLogoMark size="lg" />

      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-[28px] font-extrabold leading-tight tracking-wide text-black">
          {SITE_NAME_MAIN_PART}
          <UnofficialLabel className="text-xs" />
        </p>
        <p className="text-[18px] font-bold leading-tight text-primary-accent">
          {SITE_NAME_LOCAL_PART}
        </p>
        <p className="text-sm font-bold leading-loose text-black">
          地方議会の議論をわかりやすく
        </p>
      </div>
    </Link>
  );
}
