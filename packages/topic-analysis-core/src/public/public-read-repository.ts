import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, asc, desc, eq, type SQL } from "@mirai-gikai/db/orm";
import {
  interview_configs,
  interview_messages,
  interview_report,
  interview_sessions,
  topic,
  topic_analysis_version,
} from "@mirai-gikai/db/schema";
import type {
  PublishedVersionMeta,
  RawOpinionRow,
  RawRespondentDetailRow,
  RawRespondentRow,
  RawTopicRow,
  RawTranscriptMessageRow,
} from "./public-types";

export type PublishedAnalysisData = {
  meta: PublishedVersionMeta;
  rawTopics: RawTopicRow[];
};

/**
 * 指定 version のトピック＋意見（§8 判定に必要な interview_report 属性込み）を生データで取得する。
 * version の選び方（公開中 / 最新）に依存しない共通処理。フィルタ・集計は純粋関数側で行う。
 */
async function fetchAnalysisData(
  version: { id: string; version: number; completed_at: string | null },
  billId: string
): Promise<PublishedAnalysisData> {
  const topics = await createDb().query.topic.findMany({
    columns: { id: true, title: true, description: true, sort_order: true },
    where: eq(topic.version_id, version.id),
    orderBy: asc(topic.sort_order),
    with: {
      topic_opinion: {
        columns: {},
        with: {
          interview_opinion: {
            columns: {
              id: true,
              title: true,
              content: true,
              contextual_quote: true,
              bill_sentiment: true,
              richness: true,
              source_message_id: true,
              interview_report_id: true,
            },
            with: {
              interview_report: {
                columns: {
                  is_public_by_user: true,
                  is_public_by_admin: true,
                  moderation_status: true,
                  role: true,
                  role_title: true,
                  created_at: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const rawTopics: RawTopicRow[] = topics.map((t) => {
    const opinions: RawOpinionRow[] = [];
    for (const link of t.topic_opinion) {
      const o = link.interview_opinion;
      if (!o || !o.interview_report) continue;
      opinions.push({
        id: o.id,
        interview_report_id: o.interview_report_id,
        created_at: o.interview_report.created_at,
        title: o.title,
        content: o.content,
        contextual_quote: o.contextual_quote,
        source_message_id: o.source_message_id,
        bill_sentiment: o.bill_sentiment,
        richness: o.richness,
        is_public_by_user: o.interview_report.is_public_by_user,
        is_public_by_admin: o.interview_report.is_public_by_admin,
        moderation_status: o.interview_report.moderation_status,
        role: o.interview_report.role,
        role_title: o.interview_report.role_title,
      });
    }
    return { id: t.id, title: t.title, description: t.description, opinions };
  });

  return {
    meta: {
      bill_id: billId,
      version: version.version,
      generated_at: version.completed_at,
    },
    rawTopics,
  };
}

const VERSION_COLUMNS = {
  id: topic_analysis_version.id,
  version: topic_analysis_version.version,
  completed_at: topic_analysis_version.completed_at,
};

/**
 * 議案の「公開中（is_published=true）」のトピック分析を生データで取得する（web 公開ページ用）。
 * 公開中 version が無ければ null（呼び出し側で「準備中」扱い）。
 */
export async function findPublishedAnalysis(
  billId: string
): Promise<PublishedAnalysisData | null> {
  // bill ごと公開は最大1版（one_published_per_bill）。
  const [version] = await createDb()
    .select(VERSION_COLUMNS)
    .from(topic_analysis_version)
    .where(
      and(
        eq(topic_analysis_version.bill_id, billId),
        eq(topic_analysis_version.is_published, true)
      )
    );
  if (!version) return null;
  return fetchAnalysisData(version, billId);
}

/**
 * 議案の最新トピック分析を生データで取得する（公開・非公開を問わず最大 version を返す）。
 * 内部用途（admin MCP）向け。version が無ければ null。
 */
export async function findLatestAnalysis(
  billId: string
): Promise<PublishedAnalysisData | null> {
  const [version] = await createDb()
    .select(VERSION_COLUMNS)
    .from(topic_analysis_version)
    .where(eq(topic_analysis_version.bill_id, billId))
    .orderBy(desc(topic_analysis_version.version))
    .limit(1);
  if (!version) return null;
  return fetchAnalysisData(version, billId);
}

/** モデレーション状態（interview_report.moderation_status の列挙）。 */
export type ModerationStatus = "ok" | "warning" | "ng";

/** レポート行に対する取得条件。未指定の項目は制約しない（＝全件対象）。 */
export type ReportRowFilter = {
  isPublicByAdmin?: boolean;
  isPublicByUser?: boolean;
  moderationStatus?: ModerationStatus;
};

/** web 公開ページのプリセット（管理者公開 × ユーザー公開）。 */
const PUBLIC_REPORT_FILTER: ReportRowFilter = {
  isPublicByAdmin: true,
  isPublicByUser: true,
};

function reportFilterConditions(filter: ReportRowFilter): SQL[] {
  const conditions: SQL[] = [];
  if (filter.isPublicByAdmin !== undefined) {
    conditions.push(
      eq(interview_report.is_public_by_admin, filter.isPublicByAdmin)
    );
  }
  if (filter.isPublicByUser !== undefined) {
    conditions.push(
      eq(interview_report.is_public_by_user, filter.isPublicByUser)
    );
  }
  if (filter.moderationStatus !== undefined) {
    conditions.push(
      eq(interview_report.moderation_status, filter.moderationStatus)
    );
  }
  return conditions;
}

/**
 * 議案に紐づく回答者レポート行を取得する（回答一覧用・新しい順）。
 * filter で公開フラグ・モデレーション状態を任意に絞り込む（未指定なら制約しない＝全件）。
 */
export async function findRespondentRows(
  billId: string,
  filter: ReportRowFilter = {}
): Promise<RawRespondentRow[]> {
  return createDb()
    .select({
      id: interview_report.id,
      role: interview_report.role,
      role_title: interview_report.role_title,
      stance: interview_report.stance,
      summary: interview_report.summary,
      created_at: interview_report.created_at,
    })
    .from(interview_report)
    .innerJoin(
      interview_sessions,
      eq(interview_sessions.id, interview_report.interview_session_id)
    )
    .innerJoin(
      interview_configs,
      eq(interview_configs.id, interview_sessions.interview_config_id)
    )
    .where(
      and(
        eq(interview_configs.bill_id, billId),
        ...reportFilterConditions(filter)
      )
    )
    .orderBy(desc(interview_report.created_at));
}

/**
 * web 公開ページ用: 公開（管理者公開 × ユーザー公開）のレポートのみ取得する。
 *
 * k-匿名性ゲート（公開レポート >= 20 件）は適用しない生データ取得のため、
 * 公開経路からは必ず `getPublicBillRespondents` を経由すること。
 */
export async function findPublicBillRespondentRows(
  billId: string
): Promise<RawRespondentRow[]> {
  return findRespondentRows(billId, PUBLIC_REPORT_FILTER);
}

export type RespondentDetailData = {
  report: RawRespondentDetailRow;
  messages: RawTranscriptMessageRow[];
};

/** 回答者詳細の取得条件。未指定の公開フラグ／モデレーションは制約しない。 */
export type RespondentDetailFilter = ReportRowFilter;

/**
 * レポート1件の詳細（立場説明＋会話ログ）を生データで取得する（内部用途）。
 * filter で公開フラグ・モデレーション状態を任意に絞り込む。
 * 条件に合致しない・存在しない場合は null（呼び出し側で not_found 扱い）。会話メッセージは作成日時昇順。
 */
export async function findRespondentDetail(
  reportId: string,
  filter: RespondentDetailFilter = {}
): Promise<RespondentDetailData | null> {
  const db = createDb();
  const [report] = await db
    .select({
      id: interview_report.id,
      role: interview_report.role,
      role_title: interview_report.role_title,
      stance: interview_report.stance,
      summary: interview_report.summary,
      role_description: interview_report.role_description,
      created_at: interview_report.created_at,
      interview_session_id: interview_report.interview_session_id,
    })
    .from(interview_report)
    .where(
      and(eq(interview_report.id, reportId), ...reportFilterConditions(filter))
    );
  if (!report) return null;

  const messages = await db
    .select({
      id: interview_messages.id,
      role: interview_messages.role,
      content: interview_messages.content,
      created_at: interview_messages.created_at,
    })
    .from(interview_messages)
    .where(
      eq(interview_messages.interview_session_id, report.interview_session_id)
    )
    .orderBy(asc(interview_messages.created_at));

  return {
    report: {
      id: report.id,
      role: report.role,
      role_title: report.role_title,
      stance: report.stance,
      summary: report.summary,
      role_description: report.role_description,
      created_at: report.created_at,
    },
    messages,
  };
}
