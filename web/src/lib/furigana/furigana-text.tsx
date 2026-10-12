import type { FuriganaSegment } from "@mirai-gikai/db";
import type { ReactNode } from "react";

/**
 * ふりがな付きの文章。ふりがなは漢字の部分だけに振る（送り仮名には振らない）。
 * <rt> は常に出力し、表示・非表示は html の data-furigana と CSS で切り替える。
 * ふりがなが無い（未生成）ときは text をそのまま出す。
 */
export function FuriganaText({
  segments,
  text,
}: {
  segments: readonly FuriganaSegment[] | null | undefined;
  text: string;
}): ReactNode {
  if (!segments || segments.length === 0) return text;
  return segments.map((segment, i) =>
    segment.reading ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: セグメントは並び順が意味を持ち、入れ替わらない
      <Ruby key={i} reading={segment.reading}>
        {segment.text}
      </Ruby>
    ) : (
      segment.text
    )
  );
}

/** 1語のふりがな（文言に直接ふりがなを振るときに使う） */
export function Ruby({
  children,
  reading,
}: {
  children: ReactNode;
  reading: string;
}) {
  return (
    <ruby>
      {children}
      <rt className="furigana-rt">{reading}</rt>
    </ruby>
  );
}
