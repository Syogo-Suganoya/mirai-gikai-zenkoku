import "server-only";

import { createDb, queryRows, uuidArray } from "@mirai-gikai/db";
import { and, count, eq, inArray, sql } from "@mirai-gikai/db/orm";
import { interview_report, report_reactions } from "@mirai-gikai/db/schema";
import { isPublicReportVisible } from "@mirai-gikai/shared/report-publication/auto-publish";
import { isUuid } from "@/lib/utils/uuid";
import type { ReactionCounts, ReactionType } from "../../shared/types";

/**
 * レポートが公開されているか確認する
 * ユーザー/管理者の公開設定を満たす場合のみ公開
 */
export async function getReportPublicStatus(
  reportId: string
): Promise<boolean> {
  if (!isUuid(reportId)) return false;
  const row = await createDb().query.interview_report.findFirst({
    columns: { is_public_by_admin: true, is_public_by_user: true },
    where: eq(interview_report.id, reportId),
    with: {
      interview_sessions: {
        columns: {},
        with: { interview_configs: { columns: { bill_id: true } } },
      },
    },
  });

  if (!row?.interview_sessions?.interview_configs?.bill_id) {
    return false;
  }

  return isPublicReportVisible({
    isPublicByAdmin: row.is_public_by_admin,
    isPublicByUser: row.is_public_by_user,
  });
}

/**
 * レポートIDからリアクション数をSQL COUNTで集計して返す
 */
export async function findReactionCountsByReportId(
  reportId: string
): Promise<ReactionCounts> {
  const rows = await createDb()
    .select({
      reaction_type: report_reactions.reaction_type,
      cnt: count(),
    })
    .from(report_reactions)
    .where(eq(report_reactions.interview_report_id, reportId))
    .groupBy(report_reactions.reaction_type);

  const counts: ReactionCounts = { helpful: 0, hmm: 0 };
  for (const row of rows) {
    if (row.reaction_type === "helpful" || row.reaction_type === "hmm") {
      counts[row.reaction_type] = row.cnt;
    }
  }
  return counts;
}

/**
 * ユーザーの現在のリアクションを取得
 */
export async function findUserReaction(
  reportId: string,
  userId: string
): Promise<ReactionType | null> {
  const [row] = await createDb()
    .select({ reaction_type: report_reactions.reaction_type })
    .from(report_reactions)
    .where(
      and(
        eq(report_reactions.interview_report_id, reportId),
        eq(report_reactions.user_id, userId)
      )
    )
    .limit(1);

  return row ? (row.reaction_type as ReactionType) : null;
}

/**
 * リアクションをupsert（なければ挿入、あれば更新）
 */
export async function upsertReaction(
  reportId: string,
  userId: string,
  reactionType: ReactionType
): Promise<void> {
  await createDb()
    .insert(report_reactions)
    .values({
      interview_report_id: reportId,
      user_id: userId,
      reaction_type: reactionType,
    })
    .onConflictDoUpdate({
      target: [report_reactions.interview_report_id, report_reactions.user_id],
      set: { reaction_type: reactionType },
    });
}

/**
 * リアクションを削除
 */
export async function deleteReaction(
  reportId: string,
  userId: string
): Promise<void> {
  await createDb()
    .delete(report_reactions)
    .where(
      and(
        eq(report_reactions.interview_report_id, reportId),
        eq(report_reactions.user_id, userId)
      )
    );
}

/**
 * 複数レポートのリアクション数をDB側で集約して一括取得
 * DB function でGROUP BY集計を行い、転送量を最小化する
 */
export async function findReactionCountsByReportIds(
  reportIds: string[]
): Promise<Map<string, ReactionCounts>> {
  const countsMap = new Map<string, ReactionCounts>();
  if (reportIds.length === 0) return countsMap;

  const rows = await queryRows<{
    interview_report_id: string;
    reaction_type: string;
    cnt: string | number;
  }>(
    createDb(),
    sql`select * from count_reactions_by_report_ids(${uuidArray(reportIds)})`
  );

  for (const row of rows) {
    const counts = countsMap.get(row.interview_report_id) ?? {
      helpful: 0,
      hmm: 0,
    };
    counts[row.reaction_type as ReactionType] = Number(row.cnt);
    countsMap.set(row.interview_report_id, counts);
  }

  return countsMap;
}

/**
 * 複数レポートに対するユーザーのリアクションを一括取得
 */
export async function findUserReactionsByReportIds(
  reportIds: string[],
  userId: string
): Promise<Map<string, ReactionType>> {
  const reactionsMap = new Map<string, ReactionType>();
  if (reportIds.length === 0) return reactionsMap;

  const rows = await createDb()
    .select({
      interview_report_id: report_reactions.interview_report_id,
      reaction_type: report_reactions.reaction_type,
    })
    .from(report_reactions)
    .where(
      and(
        inArray(report_reactions.interview_report_id, reportIds),
        eq(report_reactions.user_id, userId)
      )
    );

  for (const row of rows) {
    reactionsMap.set(
      row.interview_report_id,
      row.reaction_type as ReactionType
    );
  }

  return reactionsMap;
}
