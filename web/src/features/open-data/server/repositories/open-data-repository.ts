import "server-only";

import { createDb, queryRows } from "@mirai-gikai/db";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "@mirai-gikai/db/orm";
import {
  assemblies,
  bill_contents,
  bills,
  interview_configs,
  interview_messages,
} from "@mirai-gikai/db/schema";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { OpenDataCursor } from "../../shared/utils/cursor";
import type {
  OpenDataBillDetailRow,
  OpenDataBillRow,
} from "../../shared/utils/to-open-data-bill";
import type { OpenDataOpenInterviewRow } from "../../shared/utils/to-open-data-open-interview";

export type OpenDataReportRow = {
  report_id: string;
  bill_id: string;
  bill_name: string;
  stance: string | null;
  role: string | null;
  role_title: string | null;
  role_description: string | null;
  summary: string | null;
  opinions: unknown;
  interview_session_id: string;
  created_at: string;
};

/**
 * 二次利用許諾済みの公開レポートを新しい順に取得する。
 * フィルタ条件（公開フラグ × 二次利用許諾 × 公開議案 × ダミー除外 × k-匿名性ゲート）は
 * DB function 側に集約している。
 */
export async function findOpenDataReports(params: {
  minPublicReports: number;
  limit: number;
  cursor: OpenDataCursor | null;
}): Promise<OpenDataReportRow[]> {
  return queryRows<OpenDataReportRow>(
    createDb(),
    sql`select * from find_open_data_interview_reports(
      ${params.minPublicReports}::int,
      ${params.limit}::int,
      ${params.cursor?.createdAt ?? null}::timestamptz,
      ${params.cursor?.id ?? null}::uuid
    )`
  );
}

export type OpenDataMessageRow = {
  interview_session_id: string;
  role: "assistant" | "user";
  content: string;
};

/**
 * セッションIDの集合に対する会話ログを作成日時昇順で取得する。
 */
export async function findMessagesBySessionIds(
  sessionIds: string[]
): Promise<OpenDataMessageRow[]> {
  if (sessionIds.length === 0) return [];

  return createDb()
    .select({
      interview_session_id: interview_messages.interview_session_id,
      role: interview_messages.role,
      content: interview_messages.content,
    })
    .from(interview_messages)
    .where(inArray(interview_messages.interview_session_id, sessionIds))
    .orderBy(asc(interview_messages.created_at));
}

/** オープンデータに出す議案の条件（公開中で、ダミーでない。8.5.3節） */
function openDataBillWhere(assemblySlug: string | null): SQL | undefined {
  return and(
    eq(bills.publish_status, "published"),
    eq(bills.is_dummy, false),
    assemblySlug
      ? inArray(
          bills.assembly_id,
          createDb()
            .select({ id: assemblies.id })
            .from(assemblies)
            .where(eq(assemblies.slug, assemblySlug))
        )
      : undefined
  );
}

/** 議案に付ける情報（議会・議決結果・難易度別コンテンツ・賛否・タグ） */
function openDataBillWith<C extends "summary" | "content">(
  difficulty: DifficultyLevelEnum,
  withContent: C
) {
  return {
    assembly: { columns: { slug: true, name: true } },
    bill_result: { columns: { result: true, decided_on: true } },
    bill_contents: {
      columns: {
        title: true,
        summary: true,
        ...(withContent === "content" ? { content: true } : {}),
      },
      where: eq(bill_contents.difficulty_level, difficulty),
    },
    mirai_stances: {
      columns: { type: true, comment: true, publish_at: true },
    },
    bills_tags: {
      columns: {},
      with: { tags: { columns: { id: true, label: true } } },
    },
  } as const;
}

const openDataBillColumns = {
  id: true,
  bill_number: true,
  name: true,
  category: true,
  publish_level: true,
  status: true,
  status_note: true,
  submitted_date: true,
  published_at: true,
  created_at: true,
} as const;

/**
 * 公開中の議案を議会・議決結果・難易度別コンテンツ・チームみらいの賛否・タグ付きで
 * 新しい順（created_at DESC, id DESC）に取得する。
 * 件名のみの議案も含める（bill_contents は空になる）。
 */
export async function findOpenDataPublishedBills(params: {
  limit: number;
  cursor: OpenDataCursor | null;
  difficulty: DifficultyLevelEnum;
  assemblySlug: string | null;
}): Promise<OpenDataBillRow[]> {
  const cursorCondition = params.cursor
    ? or(
        lt(bills.created_at, params.cursor.createdAt),
        and(
          eq(bills.created_at, params.cursor.createdAt),
          lt(bills.id, params.cursor.id)
        )
      )
    : undefined;

  const rows = await createDb().query.bills.findMany({
    columns: openDataBillColumns,
    where: and(openDataBillWhere(params.assemblySlug), cursorCondition),
    with: openDataBillWith(params.difficulty, "summary"),
    orderBy: [desc(bills.created_at), desc(bills.id)],
    limit: params.limit,
  });
  return rows as OpenDataBillRow[];
}

/**
 * 公開中の議案を1件、議会・議決結果・難易度別コンテンツ・チームみらいの賛否・タグ付きで取得する。
 * 非公開・ダミー・存在しない場合は null。
 */
export async function findOpenDataPublishedBillById(params: {
  billId: string;
  difficulty: DifficultyLevelEnum;
}): Promise<OpenDataBillDetailRow | null> {
  const row = await createDb().query.bills.findFirst({
    columns: openDataBillColumns,
    where: and(openDataBillWhere(null), eq(bills.id, params.billId)),
    with: openDataBillWith(params.difficulty, "content"),
  });
  return (row as OpenDataBillDetailRow | undefined) ?? null;
}

/**
 * レートリミットカウンタを加算し、制限内かを返す。
 */
export async function consumeRateLimit(params: {
  key: string;
  windowStart: string;
  limit: number;
}): Promise<boolean> {
  const [row] = await queryRows<{ allowed: boolean }>(
    createDb(),
    sql`select increment_api_rate_limit(
      ${params.key}, ${params.windowStart}::timestamptz, ${params.limit}::int
    ) as allowed`
  );
  return row?.allowed === true;
}

/**
 * 受付中のインタビュー設定を、議案と難易度別コンテンツ付きで新しい順に取得する。
 * 受付中とは、インタビュー設定が公開（status = public）かつ未削除で、
 * 議案が公開中（publish_status = published）かつダミーでないこと（インタビューページの表示条件と同じ）。
 * 議案ごとに公開中の設定は高々1件のため、件数は公開中の議案数を超えない。
 * 指定難易度のコンテンツが存在しない議案は含めない。
 */
export async function findOpenDataOpenInterviewConfigs(params: {
  difficulty: DifficultyLevelEnum;
}): Promise<OpenDataOpenInterviewRow[]> {
  const rows = await createDb()
    .select({
      estimated_duration: interview_configs.estimated_duration,
      created_at: interview_configs.created_at,
      bill_id: bills.id,
      bill_slug: bills.slug,
      bill_name: bills.name,
      thumbnail_url: bills.thumbnail_url,
      assembly_slug: assemblies.slug,
      title: bill_contents.title,
      summary: bill_contents.summary,
    })
    .from(interview_configs)
    .innerJoin(bills, eq(bills.id, interview_configs.bill_id))
    .innerJoin(assemblies, eq(assemblies.id, bills.assembly_id))
    .innerJoin(
      bill_contents,
      and(
        eq(bill_contents.bill_id, bills.id),
        eq(bill_contents.difficulty_level, params.difficulty)
      )
    )
    .where(
      and(
        eq(interview_configs.status, "public"),
        isNull(interview_configs.deleted_at),
        eq(bills.publish_status, "published"),
        eq(bills.is_dummy, false)
      )
    )
    .orderBy(desc(interview_configs.created_at), desc(interview_configs.id));

  return rows.map((row) => ({
    estimated_duration: row.estimated_duration,
    created_at: row.created_at,
    bills: {
      id: row.bill_id,
      slug: row.bill_slug,
      name: row.bill_name,
      thumbnail_url: row.thumbnail_url,
      assembly_slug: row.assembly_slug,
      bill_contents: [{ title: row.title, summary: row.summary }],
    },
  }));
}
