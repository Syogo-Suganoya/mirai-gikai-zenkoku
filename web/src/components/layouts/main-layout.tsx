"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  isAssemblySelectPage,
  isInterviewSection,
  isMainPage,
} from "@/lib/page-layout-utils";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const useSidebarLayout = isMainPage(pathname);
  const isInterview = isInterviewSection(pathname);
  const isSelectPage = isAssemblySelectPage(pathname);

  return (
    <div
      className={cn(
        // モバイルは余白なし（ヒーロー/サムネイルを画面最上部に表示）、md以上で固定
        // ヘッダー分の上余白を確保する。パンくずを持つページは各ページ側で
        // モバイル時の上余白（pt-24 md:pt-0）を付与してヘッダー埋もれを回避する。
        "relative mx-auto md:mt-24",
        // 議会選択（/）は地図の横に開会中の議会を並べるので広くする
        isSelectPage ? "max-w-[1100px]" : "max-w-[700px]",
        // インタビューページ以外ではshadowを表示
        !isInterview && "sm:shadow-lg",
        // TOP・議案一覧・議案詳細のみ、チャットサイドバー用のオフセット
        useSidebarLayout && "pc:mr-[500px] xl:ml-[calc(calc(100vw-1180px)/2)]"
      )}
    >
      {children}
    </div>
  );
}
