import { createDb, type Db } from "@mirai-gikai/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "@mirai-gikai/db/orm";
import {
  interview_configs,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";
import type { BackfillTargetReport } from "../shared/types";

/** 議案に属するレポートだけに絞る条件（billId 未指定なら絞らない） */
function billFilter(db: Db, billId: string | undefined) {
  if (!billId) return undefined;
  return inArray(
    interview_report.interview_session_id,
    db
      .select({ id: interview_sessions.id })
      .from(interview_sessions)
      .innerJoin(
        interview_configs,
        eq(interview_configs.id, interview_sessions.interview_config_id)
      )
      .where(eq(interview_configs.bill_id, billId))
  );
}

/** レポート件数を返す（pendingOnly=未再抽出のみ）。billId 指定時は当該議案に限定する。 */
async function countReports(
  billId: string | undefined,
  pendingOnly: boolean
): Promise<number> {
  const db = createDb();
  const [row] = await db
    .select({ count: count() })
    .from(interview_report)
    .where(
      and(
        billFilter(db, billId),
        pendingOnly ? isNull(interview_report.opinions_reextracted_at) : undefined
      )
    );
  return row?.count ?? 0;
}

/**
 * 未再抽出（opinions_reextracted_at IS NULL）のレポート件数を返す。
 * 進捗表示・チャンク連鎖の継続判定に使う。billId 指定時は当該議案に限定する。
 */
export function countPendingReextraction(billId?: string): Promise<number> {
  return countReports(billId, true);
}

/** interview_report の総件数（進捗の分母表示用）。billId 指定時は当該議案に限定する。 */
export function countAllReports(billId?: string): Promise<number> {
  return countReports(billId, false);
}

/**
 * 未再抽出レポートを公開同意優先・古い順で limit 件取得する。
 * billId 指定時は当該議案に限定する。
 */
export async function findReportsToReextract(
  limit: number,
  billId?: string
): Promise<BackfillTargetReport[]> {
  const db = createDb();
  const rows = await db
    .select({
      id: interview_report.id,
      interview_session_id: interview_report.interview_session_id,
    })
    .from(interview_report)
    .where(
      and(
        billFilter(db, billId),
        isNull(interview_report.opinions_reextracted_at)
      )
    )
    .orderBy(
      desc(interview_report.is_public_by_user),
      asc(interview_report.created_at)
    )
    .limit(limit);

  return rows.map((r) => ({ reportId: r.id, sessionId: r.interview_session_id }));
}

/**
 * 指定議案の全レポートの再抽出ウォーターマーク（opinions_reextracted_at）を NULL に戻す。
 * scope="all"（既処理含む全件やり直し）の起点。これにより以後は未再抽出として扱われ、
 * pending 件数を進捗の分母にできる（再実行の早期完了表示を防ぐ）。リセット件数を返す。
 */
export async function resetReextractionForBill(
  billId: string
): Promise<number> {
  const db = createDb();
  const updated = await db
    .update(interview_report)
    .set({ opinions_reextracted_at: null })
    .where(
      and(
        billFilter(db, billId),
        isNotNull(interview_report.opinions_reextracted_at)
      )
    )
    .returning({ id: interview_report.id });
  return updated.length;
}

/**
 * 再抽出を試行したが失敗したレポートに処理時刻だけ記録する。
 * 公開同意優先の並びで失敗レポートが先頭に滞留して前進が止まるのを防ぐため、
 * 失敗時もウォーターマークを進める（再実行時は当該行を NULL に戻す）。
 */
export async function markReextractionAttempted(
  reportId: string,
  reextractedAtIso: string
): Promise<void> {
  await createDb()
    .update(interview_report)
    .set({ opinions_reextracted_at: reextractedAtIso })
    .where(eq(interview_report.id, reportId));
}
