import { resolveBackfillParams } from "@mirai-gikai/topic-analysis-core/backfill-params";
import {
  countPendingReextraction,
  resetReextractionForBill,
} from "@mirai-gikai/topic-analysis-core/repository";
import { requireUser } from "@/features/auth/server/lib/session";
import { runBackfill } from "@mirai-gikai/topic-analysis-core/backfill";
import { after } from "next/server";

// 分析は応答を返したあと（after）この関数の中で動かす。Vercel の関数の上限（Hobby は 300 秒）まで使う。
// 意見が増えて収まらなくなったら、GitHub Actions などの別の実行環境に移す
export const maxDuration = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * 意見再抽出バックフィルの入口（Admin 手動トリガ）。
 * リクエストボディで議案スコープ（billId）・対象範囲（scope）・使用モデル（model）を指定できる。
 * 対象レポートがあれば、応答のあとに再抽出を動かす（関数の上限まで。残りは次の実行で続きから）。
 */
export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  // 空ボディ（旧クライアント互換）は既定値（全議案・未再抽出）として扱うが、
  // 壊れた JSON や非オブジェクト（null / 配列 / プリミティブ）は黙って既定実行に
  // せず 400 で弾く（意図しない起動・プロパティアクセスでの 500 を防ぐ）。
  let body: { billId?: unknown; scope?: unknown; model?: unknown } = {};
  const raw = await request.text();
  if (raw.trim()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: "リクエストボディの JSON が不正です" }, 400);
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return json(
        { error: "リクエストボディはオブジェクトである必要があります" },
        400
      );
    }
    body = parsed as { billId?: unknown; scope?: unknown; model?: unknown };
  }

  const resolved = resolveBackfillParams({
    billId: body.billId,
    scope: body.scope,
    model: body.model,
  });
  if (!resolved.ok) {
    return json({ error: resolved.error }, 400);
  }
  const { billId, scope } = resolved.params;

  try {
    // scope="all" は起動前に同期的にウォーターマークをリセットする。
    // これで pending=全件 となり、UI が即座に進捗を分母込みで把握できるため、
    // 「既に再抽出済みの議案で pending=0 を見て早期完了表示→重複起動」を防ぐ。
    if (scope === "all" && billId) {
      await resetReextractionForBill(billId);
    }

    // 対象件数（未再抽出件数）を確認し、0 件なら起動しない。
    // all はリセット後なので pending=全件、pending はそのまま未再抽出件数。
    const pending = await countPendingReextraction(billId);
    if (pending === 0) {
      return json({ started: false, pending });
    }

    after(async () => {
      try {
        await runBackfill(resolved.params);
      } catch (error) {
        console.error("[OpinionBackfill] backfill failed:", error);
      }
    });

    return json({ started: true, pending });
  } catch (error) {
    console.error("[OpinionBackfill] dispatch failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      500
    );
  }
}
