import "server-only";

import { createDb, queryRows } from "@mirai-gikai/db";
import { and, asc, desc, eq, sql } from "@mirai-gikai/db/orm";
import {
  interview_messages,
  interview_report,
  interview_sessions,
} from "@mirai-gikai/db/schema";

import { shouldAutoPublishOnUserSettingChange } from "@mirai-gikai/shared/report-publication/auto-publish";
import { isUuid } from "@/lib/utils/uuid";
import type {
  PublicReportStanceCountRow,
  RawPublicInterviewReport,
} from "../../shared/utils/public-report-display";
import type { SortOrder } from "../../shared/utils/sort-order";

/** レポートに付けるセッションの情報（議案IDは設定から引く） */
function sessionWith(columns: { user_id?: true }) {
  return {
    interview_sessions: {
      columns: { ...columns, started_at: true, completed_at: true },
      with: { interview_configs: { columns: { bill_id: true } } },
    },
  } as const;
}

/**
 * レポートIDからインタビューレポートとセッション情報を結合取得
 */
export async function findReportWithSessionById(reportId: string) {
  if (!isUuid(reportId)) {
    throw new Error(`Interview report not found: ${reportId}`);
  }
  const row = await createDb().query.interview_report.findFirst({
    where: eq(interview_report.id, reportId),
    with: sessionWith({ user_id: true }),
  });
  if (!row) {
    throw new Error(`Interview report not found: ${reportId}`);
  }
  return row;
}

/**
 * セッションIDからインタビューレポートを取得
 */
export async function findReportBySessionId(sessionId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_report)
    .where(eq(interview_report.interview_session_id, sessionId))
    .limit(1);
  if (!row) {
    throw new Error(`Interview report not found for session: ${sessionId}`);
  }
  return row;
}

/**
 * セッションIDからインタビューメッセージ一覧を取得（作成日時昇順）
 */
export async function findMessagesBySessionId(sessionId: string) {
  return createDb()
    .select()
    .from(interview_messages)
    .where(eq(interview_messages.interview_session_id, sessionId))
    .orderBy(asc(interview_messages.created_at));
}

/**
 * 議案IDから議案情報を取得（解説のタイトルと、リンク用の slug・議会のスラッグ付き）
 */
export async function findBillWithContentById(billId: string) {
  const row = await createDb().query.bills.findFirst({
    where: (bills, { eq }) => eq(bills.id, billId),
    columns: {
      id: true,
      slug: true,
      name: true,
      thumbnail_url: true,
      share_thumbnail_url: true,
    },
    with: {
      assembly: { columns: { slug: true } },
      bill_contents: { columns: { title: true } },
    },
  });
  if (!row) {
    throw new Error(`Bill not found: ${billId}`);
  }
  const { assembly, ...bill } = row;
  return { ...bill, assembly_slug: assembly.slug };
}

/**
 * 議案IDから公開インタビューレポートを取得（helpful×5+total_content_richnessの重み付きスコア降順、件数制限あり）
 * 公開条件: is_public_by_admin = true AND is_public_by_user = true
 */
export async function findPublicReportsByBillId(
  billId: string,
  limit: number = 3,
  offset: number = 0,
  stance?: string,
  sortOrder: SortOrder = "recommended"
) {
  return queryRows<RawPublicInterviewReport>(
    createDb(),
    sql`select * from find_public_reports_by_bill_id_ordered_by_reactions(
      ${billId}::uuid, ${limit}, ${offset}, ${stance ?? null}, ${sortOrder}
    )`
  );
}

/**
 * 議案IDからスタンスごとの公開レポート件数を取得
 */
export async function countPublicReportsByStance(billId: string) {
  return queryRows<PublicReportStanceCountRow>(
    createDb(),
    sql`select * from count_public_reports_by_stance(${billId}::uuid)`
  );
}

/**
 * 議案IDの公開インタビューレポート件数を取得
 */
// 公開レポート件数のカウントは web・admin MCP で共有するため
// @mirai-gikai/shared に集約。既存の呼び出し元はこの re-export 経由で参照する。
export { countPublicReportsByBillId } from "@mirai-gikai/shared/report-publication/count-public-reports";

/**
 * 公開レポートをIDから取得（認証不要）
 * 公開条件: is_public_by_admin = true AND is_public_by_user = true
 * 条件を満たすレポートがなければ null（呼び出し側で 404 にする）
 */
export async function findPublicReportWithSessionById(reportId: string) {
  // URL から来る ID なので、UUID の形でなければ DB に投げずに「ない」扱いにする
  if (!isUuid(reportId)) return null;
  const row = await createDb().query.interview_report.findFirst({
    where: and(
      eq(interview_report.id, reportId),
      eq(interview_report.is_public_by_admin, true),
      eq(interview_report.is_public_by_user, true)
    ),
    with: sessionWith({}),
  });
  return row ?? null;
}

/**
 * ユーザーの過去のインタビューレポートを取得（指定interview_config配下、新しい順）
 */
export async function findUserReportsByInterviewConfigId(
  interviewConfigId: string,
  userId: string
) {
  return createDb()
    .select({
      id: interview_report.id,
      stance: interview_report.stance,
      role: interview_report.role,
      role_title: interview_report.role_title,
      summary: interview_report.summary,
      created_at: interview_report.created_at,
    })
    .from(interview_report)
    .innerJoin(
      interview_sessions,
      eq(interview_sessions.id, interview_report.interview_session_id)
    )
    .where(
      and(
        eq(interview_sessions.interview_config_id, interviewConfigId),
        eq(interview_sessions.user_id, userId)
      )
    )
    .orderBy(desc(interview_report.created_at));
}

/**
 * レポートの公開設定を更新
 */
export async function updateReportPublicSetting(
  reportId: string,
  isPublic: boolean,
  isDataReuseConsented?: boolean
) {
  const db = createDb();
  const [report] = await db
    .select({
      is_public_by_admin: interview_report.is_public_by_admin,
      admin_unpublished_at: interview_report.admin_unpublished_at,
      moderation_score: interview_report.moderation_score,
      total_content_richness: interview_report.total_content_richness,
    })
    .from(interview_report)
    .where(eq(interview_report.id, reportId))
    .limit(1);

  if (!report) {
    throw new Error(`Interview report not found: ${reportId}`);
  }

  // 二次利用（オープンデータ提供）同意は、新規約の告知を表示したUIが
  // 明示的に渡した場合のみ更新する（告知を表示していない旧クライアント
  // からの呼び出しで同意ありと記録してしまうことを防ぐ）
  const updateValues: {
    is_public_by_user: boolean;
    is_data_reuse_consented?: boolean;
    is_public_by_admin?: boolean;
  } = {
    is_public_by_user: isPublic,
    ...(typeof isDataReuseConsented === "boolean"
      ? { is_data_reuse_consented: isDataReuseConsented }
      : {}),
  };

  // 管理者が非公開にしたレポート（個別の公開停止・設定の論理削除に伴う一括停止）は
  // admin_unpublished_at が記録されるため、ユーザー操作では再公開しない。
  if (
    shouldAutoPublishOnUserSettingChange({
      isPublicByAdmin: report.is_public_by_admin,
      adminUnpublishedAt: report.admin_unpublished_at,
      isPublicByUser: isPublic,
      moderationScore: report.moderation_score,
      totalContentRichness: report.total_content_richness,
    })
  ) {
    updateValues.is_public_by_admin = true;
  }

  await db
    .update(interview_report)
    .set(updateValues)
    .where(eq(interview_report.id, reportId));
}
