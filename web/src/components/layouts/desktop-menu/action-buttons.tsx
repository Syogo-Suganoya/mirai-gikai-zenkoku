import { LinkButton } from "@/components/top/link-button";
import { EXTERNAL_LINKS } from "@/config/external-links";

/**
 * デスクトップメニュー: アクションボタン（サイドバー内）
 */
export function DesktopMenuActionButtons() {
  return (
    <div className="flex flex-col gap-3">
      <LinkButton
        href={EXTERNAL_LINKS.REPORT}
        icon={{
          src: "/icons/report-error.svg",
          alt: "報告",
          width: 20,
          height: 20,
        }}
      >
        誤りを報告する
      </LinkButton>
    </div>
  );
}
