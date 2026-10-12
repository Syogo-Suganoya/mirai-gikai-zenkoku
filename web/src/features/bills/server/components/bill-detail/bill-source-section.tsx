import { ExternalLink } from "lucide-react";
import { formatDateWithDots } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { getBillReviewer } from "../../loaders/get-bill-reviewer";

interface BillSourceSectionProps {
  bill: BillWithContent;
}

/**
 * 出典（原文へのリンク）と、解説の確認者の表示。
 * 中立性に関わる表示なので、議会の設定では消せない（v2 2.7・2.8節）。
 */
export async function BillSourceSection({ bill }: BillSourceSectionProps) {
  const reviewer =
    bill.publish_level === "explained"
      ? await getBillReviewer(bill.assembly_id, bill.reviewed_by)
      : null;

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
            : reviewer
              ? `解説は AI が下書きし、${reviewer.display_name}（${reviewer.affiliation}）が確認しました${bill.reviewed_at ? `（${formatDateWithDots(bill.reviewed_at)}）` : ""}。`
              : "移行データ（確認者未設定）: この解説は移行元のサービスから引き継いだもので、確認者による確認がまだ済んでいません。"}
        </p>
      )}
    </section>
  );
}
