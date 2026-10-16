/**
 * ダミーの議案（表示確認用の架空の議案）に付けるバッジ。
 * 件名にも「【ダミー】」が付いているが、一覧でひと目で分かるようにバッジでも示す。
 */
export function DummyBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-mirai-dummy-border bg-mirai-dummy-bg px-2 py-0.5 text-xs font-bold text-mirai-dummy-text ${className ?? ""}`}
    >
      ダミー
    </span>
  );
}
