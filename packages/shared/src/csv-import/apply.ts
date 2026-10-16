/**
 * CSV インポートの DB 側の処理（検証に使う情報の取得・既存行の取得・確定）。
 * 管理画面の CSV インポートと、ローカルの `pnpm seed`（初期データの投入）の両方から使う。
 */

import type { Db, FuriganaSegment, Tx } from "@mirai-gikai/db";
import { and, eq, inArray, sql } from "@mirai-gikai/db/orm";
import {
  assemblies,
  assembly_factions,
  assembly_settings,
  bill_faction_votes,
  bill_results,
  bills,
  bills_tags,
  sessions,
  tags,
} from "@mirai-gikai/db/schema";
import { isFactionActiveOn, todayInJapan } from "../bill-results/factions";
import {
  DummyDataExistsError,
  decideDummyHandling,
} from "./dummy-handling";
import { statusForResult } from "./normalize";
import type {
  AssemblyRecord,
  BillRecord,
  CsvImportKind,
  CsvRecordByKind,
  FactionRecord,
  FactionVoteRecord,
  ResultRecord,
  SessionRecord,
} from "./types";
import { billKey, type ValidationContext } from "./validate";

type DbLike = Db | Tx;

/** 種類ごとの検証に使う DB の情報を集める */
export async function loadValidationContext(
  db: DbLike,
  kind: CsvImportKind,
  assemblyId: string | null
): Promise<ValidationContext> {
  if (kind === "assemblies") {
    const rows = await db
      .select({ slug: assemblies.slug, code: assemblies.local_gov_code })
      .from(assemblies);
    return { assemblySlugs: new Map(rows.map((r) => [r.slug, r.code])) };
  }
  if (!assemblyId) {
    throw new Error("議会を指定してください");
  }

  if (kind === "bills") {
    const [sessionRows, tagRows] = await Promise.all([
      db
        .select({ key: sessions.session_key })
        .from(sessions)
        .where(eq(sessions.assembly_id, assemblyId)),
      db.select({ label: tags.label }).from(tags),
    ]);
    return {
      sessionKeys: new Set(sessionRows.map((r) => r.key)),
      tagLabels: new Set(tagRows.map((r) => r.label)),
    };
  }

  if (kind === "results") {
    const [billRows, factionRows, settingsRows] = await Promise.all([
      db
        .select({
          session_key: sessions.session_key,
          bill_number: bills.bill_number,
          category: bills.category,
        })
        .from(bills)
        .innerJoin(sessions, eq(sessions.id, bills.session_id))
        .where(eq(bills.assembly_id, assemblyId)),
      db
        .select({
          name: assembly_factions.name,
          short_name: assembly_factions.short_name,
          valid_from: assembly_factions.valid_from,
          valid_to: assembly_factions.valid_to,
        })
        .from(assembly_factions)
        .where(eq(assembly_factions.assembly_id, assemblyId)),
      db
        .select({ granularity: assembly_settings.vote_granularity })
        .from(assembly_settings)
        .where(eq(assembly_settings.assembly_id, assemblyId)),
    ]);
    return {
      bills: new Map(
        billRows.map((b) => [
          billKey(b.session_key, b.bill_number),
          { category: b.category },
        ])
      ),
      factions: factionRows,
      voteGranularity: settingsRows[0]?.granularity ?? "result_only",
      today: todayInJapan(),
    };
  }

  return {};
}

/** 既にある行を、CSV の行と同じ形・自然キーで集める（確認画面の差分に使う） */
export async function loadExistingRecords<K extends CsvImportKind>(
  db: DbLike,
  kind: K,
  assemblyId: string | null
): Promise<Map<string, Partial<CsvRecordByKind[K]>>> {
  const map = new Map<string, Partial<CsvRecordByKind[CsvImportKind]>>();

  if (kind === "assemblies") {
    const rows = await db.select().from(assemblies);
    for (const r of rows) {
      map.set(r.local_gov_code, {
        local_gov_code: r.local_gov_code,
        name: r.name,
        type: r.type,
        prefecture_code: r.prefecture_code,
        slug: r.slug,
        official_url: r.official_url,
      } satisfies AssemblyRecord);
    }
    return map as Map<string, Partial<CsvRecordByKind[K]>>;
  }
  if (!assemblyId) throw new Error("議会を指定してください");

  if (kind === "factions") {
    const rows = await db
      .select()
      .from(assembly_factions)
      .where(eq(assembly_factions.assembly_id, assemblyId));
    for (const r of rows) {
      map.set(`${r.name}|${r.valid_from}`, {
        name: r.name,
        short_name: r.short_name,
        seats: r.seats,
        valid_from: r.valid_from,
        valid_to: r.valid_to,
      } satisfies FactionRecord);
    }
  } else if (kind === "sessions") {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.assembly_id, assemblyId));
    for (const r of rows) {
      map.set(r.session_key, {
        session_key: r.session_key,
        name: r.name,
        type: r.type,
        start_date: r.start_date,
        end_date: r.end_date,
        source_url: r.source_url,
      } satisfies SessionRecord);
    }
  } else if (kind === "bills") {
    const rows = await db.query.bills.findMany({
      where: eq(bills.assembly_id, assemblyId),
      with: {
        session: { columns: { session_key: true } },
        bills_tags: { with: { tags: { columns: { label: true } } } },
      },
    });
    for (const r of rows) {
      map.set(billKey(r.session.session_key, r.bill_number), {
        session_key: r.session.session_key,
        bill_number: r.bill_number,
        official_name: r.official_name,
        name: r.name,
        category: r.category,
        submitter: r.submitter,
        submitted_date: r.submitted_date,
        committee_name: r.committee_name,
        status: r.status,
        source_url: r.source_url,
        source_pages: r.source_pages,
        tags: r.bills_tags.map((bt) => bt.tags.label),
      } satisfies BillRecord);
    }
  } else if (kind === "results") {
    const rows = await db.query.bills.findMany({
      where: eq(bills.assembly_id, assemblyId),
      columns: { bill_number: true },
      with: {
        session: { columns: { session_key: true } },
        bill_result: true,
        bill_faction_votes: {
          with: { assembly_faction: { columns: { name: true } } },
        },
      },
    });
    for (const r of rows) {
      if (!r.bill_result) continue;
      map.set(billKey(r.session.session_key, r.bill_number), {
        session_key: r.session.session_key,
        bill_number: r.bill_number,
        result: r.bill_result.result,
        decided_on: r.bill_result.decided_on,
        yes_count: r.bill_result.yes_count,
        no_count: r.bill_result.no_count,
        source_url: r.bill_result.source_url,
        faction_votes: r.bill_faction_votes.map((v) => ({
          faction_name: v.assembly_faction.name,
          vote: v.vote,
        })),
      } satisfies ResultRecord);
    }
  }

  return map as Map<string, Partial<CsvRecordByKind[K]>>;
}

export type ApplyOptions = {
  /** 件名のふりがなを作る関数（保存時にサーバーで作る） */
  furigana: (text: string) => Promise<FuriganaSegment[]>;
  /**
   * 議会にダミーデータが残っているとき、消してから取り込むことに同意したか。
   * 同意がなくダミーがあれば DummyDataExistsError を投げる（管理画面は確認モーダルを出して再実行する）。
   */
  deleteDummyData?: boolean;
};

export type ApplyResult = { insertCount: number; updateCount: number };

/** null（CSV の空欄）なら既存の値を残す */
function keep<T>(column: string, value: T | null) {
  return value === null ? sql.raw(column) : value;
}

async function applyAssemblies(
  tx: Tx,
  records: AssemblyRecord[]
): Promise<ApplyResult> {
  let insertCount = 0;
  let updateCount = 0;
  for (const r of records) {
    const [row] = await tx
      .insert(assemblies)
      .values({
        local_gov_code: r.local_gov_code,
        name: r.name,
        type: r.type,
        prefecture_code: r.prefecture_code,
        slug: r.slug ?? `lg-${r.local_gov_code}`,
        official_url: r.official_url,
      })
      .onConflictDoUpdate({
        target: assemblies.local_gov_code,
        set: {
          name: r.name,
          type: r.type,
          prefecture_code: r.prefecture_code,
          slug: keep("assemblies.slug", r.slug),
          official_url: keep("assemblies.official_url", r.official_url),
        },
      })
      .returning({ id: assemblies.id, inserted: sql<boolean>`(xmax = 0)` });
    await tx
      .insert(assembly_settings)
      .values({ assembly_id: row.id })
      .onConflictDoNothing();
    if (row.inserted) insertCount++;
    else updateCount++;
  }
  return { insertCount, updateCount };
}

async function applyFactions(
  tx: Tx,
  assemblyId: string,
  records: FactionRecord[]
): Promise<ApplyResult> {
  let insertCount = 0;
  let updateCount = 0;
  for (const r of records) {
    const [row] = await tx
      .insert(assembly_factions)
      .values({ assembly_id: assemblyId, ...r })
      .onConflictDoUpdate({
        target: [
          assembly_factions.assembly_id,
          assembly_factions.name,
          assembly_factions.valid_from,
        ],
        set: {
          short_name: keep("assembly_factions.short_name", r.short_name),
          seats: keep("assembly_factions.seats", r.seats),
          valid_to: keep("assembly_factions.valid_to", r.valid_to),
        },
      })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });
    if (row.inserted) insertCount++;
    else updateCount++;
  }
  return { insertCount, updateCount };
}

async function applySessions(
  tx: Tx,
  assemblyId: string,
  records: SessionRecord[]
): Promise<ApplyResult> {
  let insertCount = 0;
  let updateCount = 0;
  for (const r of records) {
    const [row] = await tx
      .insert(sessions)
      .values({ assembly_id: assemblyId, slug: r.session_key, ...r })
      .onConflictDoUpdate({
        target: [sessions.assembly_id, sessions.session_key],
        set: {
          name: r.name,
          type: r.type,
          start_date: r.start_date,
          end_date: r.end_date,
          source_url: keep("sessions.source_url", r.source_url),
        },
      })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });
    if (row.inserted) insertCount++;
    else updateCount++;
  }
  return { insertCount, updateCount };
}

async function applyBills(
  tx: Tx,
  assemblyId: string,
  records: BillRecord[],
  options: ApplyOptions
): Promise<ApplyResult> {
  const [sessionRows, tagRows, settingsRows, existingRows] = await Promise.all([
    tx
      .select({ id: sessions.id, key: sessions.session_key })
      .from(sessions)
      .where(eq(sessions.assembly_id, assemblyId)),
    tx.select({ id: tags.id, label: tags.label }).from(tags),
    tx
      .select({ level: assembly_settings.default_publish_level })
      .from(assembly_settings)
      .where(eq(assembly_settings.assembly_id, assemblyId)),
    tx
      .select({
        id: bills.id,
        session_id: bills.session_id,
        bill_number: bills.bill_number,
        name: bills.name,
      })
      .from(bills)
      .where(eq(bills.assembly_id, assemblyId)),
  ]);
  const sessionIdByKey = new Map(sessionRows.map((s) => [s.key, s.id]));
  const tagIdByLabel = new Map(tagRows.map((t) => [t.label, t.id]));
  const defaultPublishLevel = settingsRows[0]?.level ?? "title_only";
  const existingByKey = new Map(
    existingRows.map((b) => [`${b.session_id}|${b.bill_number}`, b])
  );

  let insertCount = 0;
  let updateCount = 0;
  for (const r of records) {
    const sessionId = sessionIdByKey.get(r.session_key);
    if (!sessionId) {
      throw new Error(`会期キー「${r.session_key}」の会期がありません`);
    }
    const existing = existingByKey.get(`${sessionId}|${r.bill_number}`);
    let billId: string;

    if (!existing) {
      const name = r.name ?? r.official_name;
      const [row] = await tx
        .insert(bills)
        .values({
          assembly_id: assemblyId,
          session_id: sessionId,
          bill_number: r.bill_number,
          official_name: r.official_name,
          name,
          name_furigana: await options.furigana(name),
          category: r.category,
          submitter: r.submitter,
          submitted_date: r.submitted_date,
          committee_name: r.committee_name,
          status: r.status ?? "introduced",
          source_url: r.source_url,
          source_pages: r.source_pages,
          publish_level: defaultPublishLevel,
          // 公開は議案一覧から確認者が行う
          publish_status: "draft",
        })
        .returning({ id: bills.id });
      billId = row.id;
      insertCount++;
    } else {
      const nameChanged = r.name !== null && r.name !== existing.name;
      await tx
        .update(bills)
        .set({
          official_name: r.official_name,
          category: r.category,
          ...(r.name !== null && { name: r.name }),
          ...(nameChanged && {
            name_furigana: await options.furigana(r.name as string),
          }),
          ...(r.submitter !== null && { submitter: r.submitter }),
          ...(r.submitted_date !== null && { submitted_date: r.submitted_date }),
          ...(r.committee_name !== null && { committee_name: r.committee_name }),
          ...(r.status !== null && { status: r.status }),
          ...(r.source_url !== null && { source_url: r.source_url }),
          ...(r.source_pages !== null && { source_pages: r.source_pages }),
        })
        .where(eq(bills.id, existing.id));
      billId = existing.id;
      updateCount++;
    }

    if (r.tags !== null) {
      await tx.delete(bills_tags).where(eq(bills_tags.bill_id, billId));
      const tagIds = r.tags
        .map((label) => tagIdByLabel.get(label))
        .filter((id): id is string => id !== undefined);
      if (tagIds.length > 0) {
        await tx
          .insert(bills_tags)
          .values(tagIds.map((tag_id) => ({ bill_id: billId, tag_id })));
      }
    }
  }
  return { insertCount, updateCount };
}

async function applyResults(
  tx: Tx,
  assemblyId: string,
  records: ResultRecord[]
): Promise<ApplyResult> {
  const [billRows, factionRows] = await Promise.all([
    tx
      .select({
        id: bills.id,
        session_key: sessions.session_key,
        bill_number: bills.bill_number,
      })
      .from(bills)
      .innerJoin(sessions, eq(sessions.id, bills.session_id))
      .where(eq(bills.assembly_id, assemblyId)),
    tx
      .select({
        id: assembly_factions.id,
        name: assembly_factions.name,
        valid_from: assembly_factions.valid_from,
        valid_to: assembly_factions.valid_to,
      })
      .from(assembly_factions)
      .where(eq(assembly_factions.assembly_id, assemblyId)),
  ]);
  const billIdByKey = new Map(
    billRows.map((b) => [billKey(b.session_key, b.bill_number), b.id])
  );
  const today = todayInJapan();
  const findFactionId = (vote: FactionVoteRecord, on: string) =>
    factionRows.find(
      (f) => f.name === vote.faction_name && isFactionActiveOn(f, on)
    )?.id;

  let insertCount = 0;
  let updateCount = 0;
  for (const r of records) {
    const billId = billIdByKey.get(billKey(r.session_key, r.bill_number));
    if (!billId) {
      throw new Error(`議案「${r.session_key} ${r.bill_number}」がありません`);
    }
    const [row] = await tx
      .insert(bill_results)
      .values({
        bill_id: billId,
        result: r.result,
        decided_on: r.decided_on,
        yes_count: r.yes_count,
        no_count: r.no_count,
        source_url: r.source_url,
      })
      .onConflictDoUpdate({
        target: bill_results.bill_id,
        set: {
          result: r.result,
          decided_on: keep("bill_results.decided_on", r.decided_on),
          yes_count: keep("bill_results.yes_count", r.yes_count),
          no_count: keep("bill_results.no_count", r.no_count),
          source_url: keep("bill_results.source_url", r.source_url),
        },
      })
      .returning({ inserted: sql<boolean>`(xmax = 0)` });
    if (row.inserted) insertCount++;
    else updateCount++;

    // 結果を取り込んだ議案は、状態を「議決済み」（継続審査・撤回はそれぞれの状態）にする
    await tx
      .update(bills)
      .set({ status: statusForResult(r.result) })
      .where(eq(bills.id, billId));

    if (r.faction_votes.length > 0) {
      const on = r.decided_on ?? today;
      await tx
        .delete(bill_faction_votes)
        .where(eq(bill_faction_votes.bill_id, billId));
      await tx.insert(bill_faction_votes).values(
        r.faction_votes.map((v) => {
          const factionId = findFactionId(v, on);
          if (!factionId) {
            throw new Error(`会派「${v.faction_name}」が見つかりません`);
          }
          return { bill_id: billId, faction_id: factionId, vote: v.vote };
        })
      );
    }
  }
  return { insertCount, updateCount };
}

/**
 * 検証済みの行を DB に反映する（呼び出し側で1つのトランザクションにまとめる）。
 * 目印が既にあれば更新、なければ新規。削除は行わない。
 * ただし議会にダミーデータが残っていれば、同意（options.deleteDummyData）があるときだけ先に消す。
 */
export async function applyCsvImport<K extends CsvImportKind>(
  tx: Tx,
  kind: K,
  assemblyId: string | null,
  records: CsvRecordByKind[K][],
  options: ApplyOptions
): Promise<ApplyResult> {
  if (kind === "assemblies") {
    return applyAssemblies(tx, records as AssemblyRecord[]);
  }
  if (!assemblyId) throw new Error("議会を指定してください");
  const dummyHandling = decideDummyHandling(
    await hasDummyData(tx, assemblyId),
    options.deleteDummyData ?? false
  );
  if (dummyHandling === "reject") throw new DummyDataExistsError();
  if (dummyHandling === "delete") await deleteDummyData(tx, assemblyId);
  switch (kind) {
    case "factions":
      return applyFactions(tx, assemblyId, records as FactionRecord[]);
    case "sessions":
      return applySessions(tx, assemblyId, records as SessionRecord[]);
    case "bills":
      return applyBills(tx, assemblyId, records as BillRecord[], options);
    default:
      return applyResults(tx, assemblyId, records as ResultRecord[]);
  }
}

/** 議会にダミーの会期・議案・会派があるか（実データを入れる前の確認に使う） */
export async function hasDummyData(
  db: DbLike,
  assemblyId: string
): Promise<boolean> {
  const found = await Promise.all([
    db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.assembly_id, assemblyId), eq(sessions.is_dummy, true)))
      .limit(1),
    db
      .select({ id: bills.id })
      .from(bills)
      .where(and(eq(bills.assembly_id, assemblyId), eq(bills.is_dummy, true)))
      .limit(1),
    db
      .select({ id: assembly_factions.id })
      .from(assembly_factions)
      .where(
        and(
          eq(assembly_factions.assembly_id, assemblyId),
          eq(assembly_factions.is_dummy, true)
        )
      )
      .limit(1),
  ]);
  return found.some((rows) => rows.length > 0);
}

/**
 * 議会のダミーデータ（is_dummy の会期・議案・会派と、それにつながるもの）を消す。
 * 議案に紐づく解説・議決結果・賛否などは外部キーの cascade で一緒に消える。
 */
export async function deleteDummyData(
  tx: Tx,
  assemblyId: string
): Promise<{ sessionCount: number; billCount: number; factionCount: number }> {
  const deletedBills = await tx
    .delete(bills)
    .where(and(eq(bills.assembly_id, assemblyId), eq(bills.is_dummy, true)))
    .returning({ id: bills.id });
  const deletedSessions = await tx
    .delete(sessions)
    .where(and(eq(sessions.assembly_id, assemblyId), eq(sessions.is_dummy, true)))
    .returning({ id: sessions.id });
  const deletedFactions = await tx
    .delete(assembly_factions)
    .where(
      and(
        eq(assembly_factions.assembly_id, assemblyId),
        eq(assembly_factions.is_dummy, true)
      )
    )
    .returning({ id: assembly_factions.id });
  return {
    sessionCount: deletedSessions.length,
    billCount: deletedBills.length,
    factionCount: deletedFactions.length,
  };
}

/** 指定した議案だけをまとめて公開する（件名と原文のみの議案の一括公開など） */
export async function publishBills(tx: DbLike, billIds: string[]) {
  if (billIds.length === 0) return;
  await tx
    .update(bills)
    .set({ publish_status: "published", published_at: sql`now()` })
    .where(inArray(bills.id, billIds));
}
