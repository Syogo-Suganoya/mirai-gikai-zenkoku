import { FileText } from "lucide-react";

/** 「件名と原文のみ」で載せている議案の案内（v2 2.1節） */
export function TitleOnlyNotice({ sourceUrl }: { sourceUrl: string | null }) {
  return (
    <div className="flex gap-3 rounded-lg bg-white p-6">
      <FileText className="mt-0.5 size-5 shrink-0 text-mirai-text-muted" />
      <div className="flex flex-col gap-2 text-sm leading-relaxed">
        <p className="font-bold">この議案の解説はまだありません</p>
        <p className="text-mirai-text-secondary">
          件名・種類・付託委員会・議決結果と、原文へのリンクだけを載せています。
          {sourceUrl ? "くわしい内容は議会のサイトの原文をご覧ください。" : ""}
        </p>
      </div>
    </div>
  );
}
