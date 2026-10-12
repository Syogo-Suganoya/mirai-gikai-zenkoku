"use client";

import { usePathname } from "next/navigation";
import { EXTERNAL_LINKS } from "@/config/external-links";
import { NOT_OPERATED_BY_TEAM_MIRAI } from "@/config/site";
import { isInterviewPage } from "@/lib/page-layout-utils";

/**
 * フッター。本家とは別の非公式サイトであることと、ソースコードの公開先だけを出す
 * （FORK_GUIDELINES.md の必須要件 5・6、推奨事項の本家へのリンク）。
 */
export function Footer() {
  const pathname = usePathname();

  if (isInterviewPage(pathname)) {
    return null;
  }

  return (
    <footer className="border-t border-mirai-border bg-white py-6 text-center text-xs leading-relaxed text-mirai-text-secondary">
      <p>{NOT_OPERATED_BY_TEAM_MIRAI}。</p>
      <p>
        「みらい議会」(
        <ExternalLink href={EXTERNAL_LINKS.UPSTREAM_SERVICE}>
          gikai.team-mir.ai
        </ExternalLink>
        )の発想を参考にした、非公式の個人制作サイトです。
      </p>
      <p>
        <ExternalLink href={EXTERNAL_LINKS.GITHUB_REPO}>
          このサイトのソースコード
        </ExternalLink>
        {" ・ "}
        <ExternalLink href={EXTERNAL_LINKS.UPSTREAM_REPO}>
          本家みらい議会のリポジトリ
        </ExternalLink>
      </p>
    </footer>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      {children}
    </a>
  );
}
