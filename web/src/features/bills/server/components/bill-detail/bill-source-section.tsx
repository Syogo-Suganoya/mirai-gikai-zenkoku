import { ExternalLink } from "lucide-react";
import type { BillWithContent } from "../../../shared/types";

interface BillSourceSectionProps {
  bill: BillWithContent;
}

/**
 * 出典（原文へのリンク）と、解説を確認したかどうかの表示。
 * 中立性に関わる表示なので、議会の設定では消せない（v2 2.7・2.8節）。
 * 確認したかどうかは、管理画面の「解説の確認完了」（is_review_completed）で決める。
 */
export function BillSourceSection({ bill }: BillSourceSectionProps) {
  return (
    <section className="flex flex-col gap-3 rounded-lg bg-white p-6 text-sm">
      <h2 className="font-bold">出典</h2>
      {bill.source_url ? (
        <a
          href={bill.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 underline underline-offset-[3px]"
        >
          議案の原文（議会のサイト）
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="text-mirai-text-secondary">原文の URL は未登録です</p>
      )}
      {bill.source_pages && (
        <p className="text-xs text-mirai-text-secondary">
          議案書の {bill.source_pages} ページ
        </p>
      )}

      {bill.publish_level === "explained" && (
        <p className="text-xs leading-relaxed text-mirai-text-note">
          {bill.is_dummy
            ? "この解説は表示確認用の架空のものです。"
            : bill.is_review_completed
              ? "この解説は、運営者が議案の原文と照らし合わせて確認しています。"
              : "この解説は、運営者による確認がまだ済んでいません。内容は議案の原文で確かめてください。"}
        </p>
      )}
    </section>
  );
}
