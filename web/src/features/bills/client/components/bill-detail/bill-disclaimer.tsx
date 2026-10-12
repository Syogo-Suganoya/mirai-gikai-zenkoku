import { LinkButton } from "@/components/top/link-button";
import { EXTERNAL_LINKS } from "@/config/external-links";

export function BillDisclaimer() {
  return (
    <div className="space-y-6 pt-4 pb-10">
      {/* データの出典について */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-black">掲載コンテンツについて</h3>
        <p className="text-xs leading-relaxed text-mirai-text-note">
          掲載している議案の情報は、各議会が公開している議案書・議決結果などの公開情報をもとにしています。解説のある議案は、AI
          が下書きした解説を確認者が確認したものです。件名と原文のみの議案は、議会の公開情報をそのまま並べています。
        </p>
      </div>

      {/* 掲載コンテンツについての免責事項 */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-black">免責事項</h3>
        <p className="text-xs leading-relaxed text-mirai-text-note">
          本サイトで公開する情報は、可能な限り正確かつ最新の情報を反映するよう努めていますが、その正確性・完全性・即時性について保証するものではありません。また、AIチャットは不正確または誤解を招く回答を生成する可能性があります。正確な情報は、議会の公式文書や一次資料をご確認ください。
        </p>
      </div>

      <LinkButton
        href={EXTERNAL_LINKS.REPORT}
        icon={{
          src: "/icons/report-error.svg",
          alt: "報告",
          width: 22,
          height: 22,
        }}
      >
        誤りを報告する
      </LinkButton>
    </div>
  );
}
