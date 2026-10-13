import {
  PROMPT_VERSION,
  TOPIC_MODEL,
} from "@mirai-gikai/topic-analysis-core/constants";
import {
  createVersion,
  findActiveVersionByBill,
  isStaleActiveVersion,
  updateVersionStatus,
} from "@mirai-gikai/topic-analysis-core/repository";
import { runAnalysis } from "@mirai-gikai/topic-analysis-core/analyze";
import { after } from "next/server";
import { requireUser } from "@/features/auth/server/lib/session";

// 分析は応答を返したあと（after）この関数の中で動かす。Vercel の関数の上限（Hobby は 300 秒）まで使う。
// 意見が増えて収まらなくなったら、GitHub Actions などの別の実行環境に移す（docs/デプロイ手順.md 7.1）
export const maxDuration = 300;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** ユーザー向けトピック分析の手動実行入口（Admin）。version を作り、応答のあとに分析を動かす。 */
export async function POST(request: Request) {
  try {
    await requireUser();
  } catch {
    return json({ error: "Unauthorized" }, 401);
  }

  let billId: string;
  let strategy: "full" | "incremental" = "full";
  try {
    const body: unknown = await request.json();
    const obj =
      typeof body === "object" && body !== null
        ? (body as { billId?: unknown; strategy?: unknown })
        : {};
    if (typeof obj.billId !== "string" || obj.billId.trim() === "") {
      return json({ error: "billId is required" }, 400);
    }
    billId = obj.billId.trim();
    if (obj.strategy !== undefined) {
      if (obj.strategy !== "full" && obj.strategy !== "incremental") {
        return json({ error: "strategy must be 'full' or 'incremental'" }, 400);
      }
      strategy = obj.strategy;
    }
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    // 二重起動防止（§5.3）: running/pending があればスキップ。
    // ただし ワークフローの実行が worker 到達前に死んだ等で失効した行は failed に倒し、
    // 再実行をブロックし続けないようにする（pending/running のままの残骸を自己回復）。
    const active = await findActiveVersionByBill(billId);
    if (active) {
      if (isStaleActiveVersion(active, Date.now())) {
        await updateVersionStatus(
          active.id,
          "failed",
          "stale: execution did not start or did not complete in time"
        );
      } else {
        return json({ skipped: true, versionId: active.id, reason: "running" });
      }
    }

    // 事前チェックは TOCTOU で破れるため、createVersion は
    // one_active_version_per_bill の一意制約に弾かれたら null を返す。
    // 同時 POST で負けた側はここでスキップ扱いにする（原子的ガード）。
    const version = await createVersion(
      billId,
      "manual",
      TOPIC_MODEL,
      PROMPT_VERSION
    );
    if (!version) {
      return json({ skipped: true, reason: "running" });
    }

    // 失敗したときは runAnalysis が version を failed にする（UI は version の状態で追う）
    after(async () => {
      try {
        await runAnalysis(version.id, billId, strategy);
      } catch (error) {
        console.error("[UserTopicAnalysis] analysis failed:", error);
      }
    });

    return json({ versionId: version.id });
  } catch (error) {
    console.error("[UserTopicAnalysis] dispatch failed:", error);
    return json(
      { error: error instanceof Error ? error.message : "dispatch failed" },
      500
    );
  }
}
