import { TriangleAlert } from "lucide-react";

/**
 * ダミーの議案がある議会のページ上部に出す帯（8.5.3節）。
 * 議会の設定では消せない。
 */
export function DummyDataBanner() {
  return (
    <div
      role="note"
      className="border-b border-mirai-dummy-border bg-mirai-dummy-bg pt-20 md:pt-0"
    >
      <div className="mx-auto flex max-w-4xl items-start gap-2 px-4 py-3 text-sm font-bold text-mirai-dummy-text">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          このページの議案は表示確認用のダミーです。実在の議案・議決結果ではありません
        </p>
      </div>
    </div>
  );
}
