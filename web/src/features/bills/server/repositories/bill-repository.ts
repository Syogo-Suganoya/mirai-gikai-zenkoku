import "server-only";

import { createDb } from "@mirai-gikai/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  or,
  type SQL,
  sql,
} from "@mirai-gikai/db/orm";
import {
  assembly_factions,
  bill_contents,
  bill_faction_votes,
  bills,
  bills_tags,
  interview_configs,
  mirai_stances,
  preview_tokens,
  tags,
} from "@mirai-gikai/db/schema";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { isUuid } from "@/lib/utils/uuid";
import { groupTagsByBillId } from "../../shared/utils/group-tags";

/**
 * URL の議案の目印（slug か id）で引く条件。
 * slug は議会の中でだけ一意なので、slug で引くときは議会も条件にする。
 */
function billKeyCondition(key: string, assemblyId?: string): SQL | undefined {
  const byKey = isUuid(key)
    ? or(eq(bills.id, key), eq(bills.slug, key))
    : eq(bills.slug, key);
  return assemblyId ? and(eq(bills.assembly_id, assemblyId), byKey) : byKey;
}

/** 一覧で使う議案の取得（難易度の解説・タグ・議決結果・議会のスラッグ付き） */
function billListWith(difficultyLevel: DifficultyLevelEnum) {
  return {
    assembly: { columns: { slug: true } },
    bill_contents: {
      where: eq(bill_contents.difficulty_level, difficultyLevel),
    },
    bills_tags: { with: { tags: { columns: { id: true, label: true } } } },
    bill_result: true,
  } as const;
}

// ============================================================
// Bills
// ============================================================

export type PublishedBillFilter = {
  assemblyId: string;
  /** 会期で絞る */
  sessionId?: string | null;
  /** 注目の議案だけ */
  featuredOnly?: boolean;
  /** 解説ありの議案だけ */
  explainedOnly?: boolean;
  /** タグで絞る */
  tagId?: string;
  /** ダミーを除く（サイトマップなど） */
  excludeDummy?: boolean;
  limit?: number;
};

/**
 * 議会の公開済み議案を、指定した難易度の解説・タグ・議決結果付きで取得する。
 * 「件名と原文のみ」の議案は解説（bill_contents）が空の配列になる。
 */
export async function findPublishedBills(
  difficultyLevel: DifficultyLevelEnum,
  filter: PublishedBillFilter
) {
  const db = createDb();
  const conditions: (SQL | undefined)[] = [
    eq(bills.assembly_id, filter.assemblyId),
    eq(bills.publish_status, "published"),
    filter.sessionId ? eq(bills.session_id, filter.sessionId) : undefined,
    filter.featuredOnly ? eq(bills.is_featured, true) : undefined,
    filter.explainedOnly ? eq(bills.publish_level, "explained") : undefined,
    filter.excludeDummy ? eq(bills.is_dummy, false) : undefined,
    filter.tagId
      ? inArray(
          bills.id,
          db
            .select({ id: bills_tags.bill_id })
            .from(bills_tags)
            .where(eq(bills_tags.tag_id, filter.tagId))
        )
      : undefined,
  ];

  return db.query.bills.findMany({
    where: and(...conditions),
    with: billListWith(difficultyLevel),
    orderBy: [
      asc(bills.status_order),
      sql`${bills.submitted_date} desc nulls last`,
      asc(bills.bill_number),
    ],
    limit: filter.limit,
  });
}

export type PublishedBillRow = Awaited<
  ReturnType<typeof findPublishedBills>
>[number];

/** 全議会の公開済み議案（サイトマップ用。ダミーは除く） */
export async function findAllPublishedBillKeys() {
  return createDb().query.bills.findMany({
    columns: { id: true, slug: true, updated_at: true },
    where: and(
      eq(bills.publish_status, "published"),
      eq(bills.is_dummy, false)
    ),
    with: { assembly: { columns: { slug: true } } },
  });
}

/**
 * 検索候補用に、公開済み議案の名称・タイトル・タグだけを取得する。
 * 解説本文（数KB／件）は引かない。
 */
export async function findPublishedBillsForSuggest(
  assemblyId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  try {
    return await createDb().query.bills.findMany({
      columns: { id: true, slug: true, name: true },
      where: and(
        eq(bills.assembly_id, assemblyId),
        eq(bills.publish_status, "published")
      ),
      with: {
        bill_contents: {
          columns: { title: true },
          where: eq(bill_contents.difficulty_level, difficultyLevel),
        },
        bills_tags: { with: { tags: { columns: { id: true, label: true } } } },
      },
      // 提出日は null と同日の重複があるので、id を第2キーにして順序を固定する。
      orderBy: [sql`${bills.submitted_date} desc nulls last`, asc(bills.id)],
    });
  } catch (error) {
    // 候補は検索の補助なので、落とさずに空で返して検索自体は使える状態にする。
    console.error("Failed to fetch bills for suggest:", error);
    return [];
  }
}

/**
 * 公開済み議案を1件取得（slug か id で引く）
 */
export async function findPublishedBillByKey(key: string, assemblyId?: string) {
  const [row] = await createDb().query.bills.findMany({
    where: and(
      billKeyCondition(key, assemblyId),
      eq(bills.publish_status, "published")
    ),
    with: {
      assembly: { columns: { slug: true, name: true } },
      bill_result: true,
    },
    limit: 1,
  });
  return row ?? null;
}

/**
 * 管理者用: ステータス問わず議案を1件取得
 */
export async function findBillByKey(key: string, assemblyId?: string) {
  const [row] = await createDb().query.bills.findMany({
    where: billKeyCondition(key, assemblyId),
    with: { assembly: { columns: { slug: true } }, bill_result: true },
    limit: 1,
  });
  return row ?? null;
}

/**
 * 議案のmirai_stanceを取得
 * 公開日時（publish_at）前のものも返すため、公開側で使う場合は
 * hideUnpublishedStance / isMiraiStancePublished で除外すること。
 */
export async function findMiraiStanceByBillId(billId: string) {
  const [row] = await createDb()
    .select()
    .from(mirai_stances)
    .where(eq(mirai_stances.bill_id, billId));
  return row ?? null;
}

/**
 * 議案のタグを取得
 */
export async function findTagsByBillId(billId: string) {
  return createDb()
    .select({ tags: { id: tags.id, label: tags.label } })
    .from(bills_tags)
    .innerJoin(tags, eq(tags.id, bills_tags.tag_id))
    .where(eq(bills_tags.bill_id, billId));
}

/**
 * 議案の会派ごとの賛否（会派名付き）
 */
export async function findFactionVotesByBillId(billId: string) {
  return createDb()
    .select({
      faction_id: assembly_factions.id,
      faction_name: assembly_factions.name,
      vote: bill_faction_votes.vote,
    })
    .from(bill_faction_votes)
    .innerJoin(
      assembly_factions,
      eq(assembly_factions.id, bill_faction_votes.faction_id)
    )
    .where(eq(bill_faction_votes.bill_id, billId))
    .orderBy(asc(assembly_factions.name));
}

// ============================================================
// Bill Contents
// ============================================================

/**
 * 指定された難易度の議案コンテンツを取得
 */
export async function findBillContentByDifficulty(
  billId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  const [row] = await createDb()
    .select()
    .from(bill_contents)
    .where(
      and(
        eq(bill_contents.bill_id, billId),
        eq(bill_contents.difficulty_level, difficultyLevel)
      )
    );
  return row ?? null;
}

// ============================================================
// Tags (bulk)
// ============================================================

/**
 * 複数のbill_idに紐づくタグを一括取得し、bill_idごとにグループ化して返す
 */
export async function findTagsByBillIds(
  billIds: string[]
): Promise<Map<string, Array<{ id: string; label: string }>>> {
  if (billIds.length === 0) {
    return new Map();
  }

  const rows = await createDb()
    .select({
      bill_id: bills_tags.bill_id,
      tags: { id: tags.id, label: tags.label },
    })
    .from(bills_tags)
    .innerJoin(tags, eq(tags.id, bills_tags.tag_id))
    .where(inArray(bills_tags.bill_id, billIds));

  return groupTagsByBillId(rows);
}

// ============================================================
// Sessions
// ============================================================

/**
 * 会期ごとの公開済み議案数（会期一覧に出す）
 */
export async function countPublishedBillsBySession(
  assemblyId: string
): Promise<Map<string, number>> {
  const rows = await createDb()
    .select({ session_id: bills.session_id, count: count() })
    .from(bills)
    .where(
      and(
        eq(bills.assembly_id, assemblyId),
        eq(bills.publish_status, "published")
      )
    )
    .groupBy(bills.session_id);
  return new Map(rows.map((r) => [r.session_id, r.count]));
}

/**
 * 種類（予算・条例など）ごとの公開済み議案数（議会トップの種類タブに出す）
 */
export async function countPublishedBillsByCategory(assemblyId: string) {
  return createDb()
    .select({ category: bills.category, count: count() })
    .from(bills)
    .where(
      and(
        eq(bills.assembly_id, assemblyId),
        eq(bills.publish_status, "published")
      )
    )
    .groupBy(bills.category);
}

// ============================================================
// Featured
// ============================================================

/**
 * featured なタグを優先度順に取得する（タグは全議会共通）。
 *
 * 取得に失敗したときは `null` を返す。0件と区別できないと、呼び出し側が
 * 「タグが無い」としてキャッシュに載せてしまい、一時的なエラーで絞り込みが
 * 消えたまま固定される。
 */
export async function findFeaturedTags() {
  try {
    return await createDb()
      .select({
        id: tags.id,
        label: tags.label,
        description: tags.description,
        featured_priority: tags.featured_priority,
      })
      .from(tags)
      .where(isNotNull(tags.featured_priority))
      // 同じ優先度のタグは label で並べる。指定しないと順序が不定になる。
      .orderBy(asc(tags.featured_priority), asc(tags.label));
  } catch (error) {
    console.error("Failed to fetch featured tags:", error);
    return null;
  }
}

/**
 * AIインタビューを受付中の公開済み議案を取得
 *
 * 受付中の判定は「status = public の interview_configs があること」。
 * 解説本文（content）は引かない。カードが出すのはタイトルと要約だけ。
 */
export async function findBillsWithPublicInterview(
  assemblyId: string,
  difficultyLevel: DifficultyLevelEnum
) {
  const db = createDb();
  return db.query.bills.findMany({
    where: and(
      eq(bills.assembly_id, assemblyId),
      eq(bills.publish_status, "published"),
      eq(bills.is_dummy, false),
      inArray(
        bills.id,
        db
          .select({ id: interview_configs.bill_id })
          .from(interview_configs)
          .where(eq(interview_configs.status, "public"))
      )
    ),
    with: {
      ...billListWith(difficultyLevel),
      bill_contents: {
        columns: { content: false, furigana: false },
        where: eq(bill_contents.difficulty_level, difficultyLevel),
      },
    },
    orderBy: sql`${bills.submitted_date} desc nulls last`,
  });
}

// ============================================================
// Coming Soon
// ============================================================

/**
 * Coming Soon議案を取得
 */
export async function findComingSoonBills(
  assemblyId: string,
  sessionId: string | null
) {
  return createDb().query.bills.findMany({
    columns: { id: true, name: true, source_url: true },
    where: and(
      eq(bills.assembly_id, assemblyId),
      eq(bills.publish_status, "coming_soon"),
      sessionId ? eq(bills.session_id, sessionId) : undefined
    ),
    with: {
      bill_contents: { columns: { title: true, difficulty_level: true } },
    },
    orderBy: desc(bills.created_at),
  });
}

// ============================================================
// Preview Tokens
// ============================================================

/**
 * プレビュートークンを検証
 */
export async function findPreviewToken(billId: string, token: string) {
  const [row] = await createDb()
    .select({ expires_at: preview_tokens.expires_at })
    .from(preview_tokens)
    .where(
      and(eq(preview_tokens.bill_id, billId), eq(preview_tokens.token, token))
    );
  return row ?? null;
}

// ============================================================
// Interview Status
// ============================================================

/**
 * 複数のbill_idに対して、公開中のインタビュー設定があるかを一括判定
 *
 * status="public" のみで判定する。論理削除（deleted_at）された設定は
 * 削除時に status="closed" へ変更されるため、ここで自然に除外される。
 */
export async function findBillIdsWithPublicInterview(
  billIds: string[]
): Promise<Set<string>> {
  if (billIds.length === 0) {
    return new Set();
  }

  try {
    const rows = await createDb()
      .select({ bill_id: interview_configs.bill_id })
      .from(interview_configs)
      .where(
        and(
          inArray(interview_configs.bill_id, billIds),
          eq(interview_configs.status, "public")
        )
      );
    return new Set(rows.map((row) => row.bill_id));
  } catch (error) {
    console.error("Failed to fetch interview configs:", error);
    return new Set();
  }
}
