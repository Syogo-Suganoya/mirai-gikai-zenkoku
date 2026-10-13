"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import { SITE_NAME } from "@/config/site";
import { AssemblyKindNav } from "@/features/assemblies/client/components/assembly-kind-nav";
import type { AssemblyKindBySlug } from "@/features/assemblies/shared/utils/assembly-kind-links";
import { DifficultySelector } from "@/features/bill-difficulty/client/components/difficulty-selector";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { InterviewHeaderActions } from "@/features/interview-session/client/components/interview-header-actions";
import { sendDifficultyStateEvent } from "@/lib/analytics/preference-state-events";
import { useOnPageView } from "@/lib/analytics/use-on-page-view";
import { isInterviewPage, isMainPage } from "@/lib/page-layout-utils";
import { routes } from "@/lib/routes";
import { HamburgerMenu } from "./hamburger-menu";

interface HeaderClientProps {
  difficultyLevel: DifficultyLevelEnum;
  kindBySlug?: AssemblyKindBySlug;
}

export function HeaderClient({
  difficultyLevel,
  kindBySlug,
}: HeaderClientProps) {
  const pathname = usePathname();
  const showDifficultySelector = isMainPage(pathname);
  const showInterviewActions = isInterviewPage(pathname);

  // Headerは1ページに1つだけ常時マウントされるため、
  // ここで難易度設定をページ表示のたびにGAへ送る
  // (DifficultySelectorはmarkdown埋め込み等で複数箇所に
  //  同時マウントされ得るため、送信元には適さない)
  useOnPageView(() => sendDifficultyStateEvent(difficultyLevel));

  return (
    <header className="px-3 fixed top-4 left-0 right-0 z-40 max-w-[1440px] mx-auto">
      <div className="rounded-2xl bg-white shadow-sm mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Site Title */}
          <div className="flex items-center">
            <Link
              href={routes.home()}
              className="flex items-center"
              aria-label={`${SITE_NAME}（非公式） ホーム`}
            >
              <SiteLogo compact />
            </Link>
            {/* 狭い画面ではメニューの中に出す */}
            <AssemblyKindNav
              className="ml-4 hidden sm:flex"
              kindBySlug={kindBySlug}
            />
          </div>

          {/* Navigation */}
          <nav
            className="flex items-center space-x-2"
            aria-label="補助ナビゲーション"
          >
            {showDifficultySelector && (
              <DifficultySelector currentLevel={difficultyLevel} />
            )}
            {showInterviewActions && <InterviewHeaderActions />}
            <HamburgerMenu kindBySlug={kindBySlug} />
          </nav>
        </div>
      </div>
    </header>
  );
}
