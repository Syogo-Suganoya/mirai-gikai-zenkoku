import { requireUser } from "@/features/auth/server/lib/session";
import { runAnalyzeAll } from "@mirai-gikai/topic-analysis-core/analyze";
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
 * 全議案トピック分析の手動実行入口（Admin）。
 * version は議案ごとに runAnalyzeAll の中で作る。応答のあとに順に分析する（関数の上限まで）。
 * 既定は incremental（差分）。1 実行で全議案を順次処理する。
 */
export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  // ボディは任意（空なら既定 incremental）。空文字以外は JSON として厳密に検証し、
  // 不正な JSON は高コストな副作用の前に 400 で弾く（握り潰して既定実行しない）。
  let strategy: "full" | "incremental" = "incremental";
  const text = await request.text();
  if (text.trim() !== "") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    if (typeof parsed !== "object" || parsed === null) {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const raw = (parsed as { strategy?: unknown }).strategy;
    if (raw !== undefined) {
      if (raw !== "full" && raw !== "incremental") {
        return json({ error: "strategy must be 'full' or 'incremental'" }, 400);
      }
      strategy = raw;
    }
  }

  try {
    after(async () => {
      try {
        await runAnalyzeAll(strategy);
      } catch (error) {
        console.error("[UserTopicAnalysis] analyze-all failed:", error);
      }
    });
    return json({ started: true, strategy });
  } catch (error) {
    console.error("[UserTopicAnalysis] dispatch-all failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      502
    );
  }
}
