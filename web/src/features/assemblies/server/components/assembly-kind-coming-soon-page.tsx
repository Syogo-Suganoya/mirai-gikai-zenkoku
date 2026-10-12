import "server-only";

import { Construction } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { routes } from "@/lib/routes";

/** 市・区町村の議会の一覧（/cities・/towns）。今のフェーズは都道府県議会だけなので作成中と出す */
export function AssemblyKindComingSoonPage({ label }: { label: string }) {
  return (
    <Container className="pt-24 pb-10 md:pt-8">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-mirai-border bg-white px-6 py-16 text-center">
        <Construction className="h-10 w-10 text-mirai-text-muted" aria-hidden />
        <h1 className="text-xl font-bold text-mirai-text">
          {label}の議会は現在作成中です
        </h1>
        <p className="text-sm leading-[1.8] text-mirai-text-secondary">
          いまは都道府県議会の議案を紹介しています。
          <br />
          {label}の議会も、準備ができしだい載せていきます。
        </p>
        <Link
          href={routes.home() as Route}
          className="text-sm font-bold text-mirai-brand-teal-hover hover:underline"
        >
          都道府県の議会を見る
        </Link>
      </div>
    </Container>
  );
}
