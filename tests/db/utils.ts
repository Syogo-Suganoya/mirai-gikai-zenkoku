import { createDb, queryRows } from "@mirai-gikai/db";
import { eq, type SQL, sql } from "@mirai-gikai/db/orm";
import {
  anonymous_visitors,
  assemblies,
  assembly_settings,
  bill_contents,
  bills,
  bills_tags,
  interview_configs,
  interview_messages,
  interview_report,
  interview_sessions,
  mirai_stances,
  preview_tokens,
  sessions,
  tags,
  users,
} from "@mirai-gikai/db/schema";

// ── 接続（DATABASE_URL。ローカルは `pnpm db:up` の Postgres） ──
export const db = createDb();

/** DB function など、行を返す SQL を実行する（本家の `supabase.rpc(...)` の置き換え） */
export function rows<T>(query: SQL): Promise<T[]> {
  return queryRows<T>(db, query);
}

/** DB function の引数名と型（`p_config_id uuid` など）。関数ごとに1度だけ調べる */
const argTypesCache = new Map<string, Map<string, string>>();

async function functionArgTypes(name: string): Promise<Map<string, string>> {
  const cached = argTypesCache.get(name);
  if (cached) return cached;
  const result = await rows<{ args: string }>(
    sql`select pg_get_function_identity_arguments(p.oid) as args
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = ${name}`
  );
  if (result.length !== 1) {
    throw new Error(`DB function ${name} が見つからないか、複数あります`);
  }
  const types = new Map<string, string>();
  for (const arg of result[0].args.split(",").map((a) => a.trim())) {
    if (!arg) continue;
    const [argName, ...type] = arg.split(" ");
    types.set(argName, type.join(" "));
  }
  argTypesCache.set(name, types);
  return types;
}

function typedValue(value: unknown, type: string): SQL {
  if (value === null || value === undefined) {
    return sql`null::${sql.raw(type)}`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return sql`'{}'::${sql.raw(type)}`;
    return sql`array[${sql.join(
      value.map((v) => sql`${v}`),
      sql`, `
    )}]::${sql.raw(type)}`;
  }
  return sql`${value}::${sql.raw(type)}`;
}

// bigint・numeric は postgres.js では文字列で返る。本家（PostgREST）と同じく数値にそろえる
const NUMERIC_OIDS = new Set([20, 1700]);

/**
 * DB function を引数名つきで呼び、行の配列を返す（本家の `supabase.rpc(name, args)` の置き換え）。
 * 引数は関数の定義の型にキャストする。bigint・numeric の列は数値にする。
 */
export async function rpc<T = Record<string, unknown>>(
  name: string,
  args: Record<string, unknown> = {}
): Promise<T[]> {
  const types = await functionArgTypes(name);
  const params = Object.entries(args).map(([key, value]) => {
    const type = types.get(key);
    if (!type) throw new Error(`${name} に引数 ${key} はありません`);
    return sql`${sql.raw(key)} => ${typedValue(value, type)}`;
  });
  const result = (await db.execute(
    sql`select * from ${sql.raw(name)}(${sql.join(params, sql`, `)})`
  )) as unknown as Record<string, unknown>[] & {
    columns?: { name: string; type: number }[];
  };
  const numericColumns = (result.columns ?? [])
    .filter((c) => NUMERIC_OIDS.has(c.type))
    .map((c) => c.name);
  return result.map((row) => {
    const converted = { ...row };
    for (const column of numericColumns) {
      if (converted[column] !== null)
        converted[column] = Number(converted[column]);
    }
    return converted as T;
  });
}

/** 1つの値を返す DB function を引数名つきで呼ぶ */
export async function rpcValue<T>(
  name: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const [row] = await rpc<Record<string, T>>(name, args);
  return row[name];
}

/** 1つの値を返す DB function を呼ぶ（`select fn(...) as value`） */
export async function scalar<T>(query: SQL): Promise<T> {
  const [row] = await rows<{ value: T }>(sql`select ${query} as value`);
  return row.value;
}

/** テストごとに重ならない文字列 */
export function uniq(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── 議会・会期 ──

/** テスト用の議会（設定つき）を作る。削除すると会期・議案もまとめて消える */
export async function createTestAssembly(
  overrides: Partial<typeof assemblies.$inferInsert> = {}
) {
  const [assembly] = await db
    .insert(assemblies)
    .values({
      slug: uniq("test-assembly"),
      name: `テスト議会 ${Date.now()}`,
      type: "prefecture",
      // 実在しない団体コード（9 から始まる7桁）
      local_gov_code: `9${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`,
      prefecture_code: "23",
      status: "public",
      ...overrides,
    })
    .returning();
  await db.insert(assembly_settings).values({ assembly_id: assembly.id });
  return assembly;
}

export async function cleanupTestAssembly(assemblyId: string): Promise<void> {
  await db.delete(assemblies).where(eq(assemblies.id, assemblyId));
}

export async function createTestSession(
  assemblyId: string,
  overrides: Partial<typeof sessions.$inferInsert> = {}
) {
  const [session] = await db
    .insert(sessions)
    .values({
      assembly_id: assemblyId,
      session_key: uniq("session"),
      name: `テスト会期 ${Date.now()}`,
      start_date: "2025-01-01",
      end_date: "2025-06-30",
      ...overrides,
    })
    .returning();
  return session;
}

// ── 議案 ──

/** 議案ごとに作った議会（cleanupTestBill で一緒に消す） */
const ownedAssemblies = new Map<string, string>();

/**
 * テスト用の議案を作る。assembly_id / session_id を渡さなければ、
 * この議案専用の議会と会期を作る（cleanupTestBill で一緒に消える）。
 */
export async function createTestBill(
  overrides: Partial<typeof bills.$inferInsert> = {}
) {
  let { assembly_id, session_id } = overrides;
  let ownedAssemblyId: string | null = null;
  if (!assembly_id) {
    const assembly = await createTestAssembly();
    assembly_id = assembly.id;
    ownedAssemblyId = assembly.id;
  }
  if (!session_id) {
    session_id = (await createTestSession(assembly_id)).id;
  }
  const name = overrides.name ?? `テスト議案 ${Date.now()}`;
  const [bill] = await db
    .insert(bills)
    .values({
      bill_number: uniq("議案第1号"),
      official_name: name,
      category: "ordinance",
      status: "introduced",
      publish_status: "draft",
      ...overrides,
      name,
      assembly_id,
      session_id,
    })
    .returning();
  if (ownedAssemblyId) ownedAssemblies.set(bill.id, ownedAssemblyId);
  return bill;
}

/** テスト用の議案を消す（CASCADE で関連データも消える） */
export async function cleanupTestBill(billId: string): Promise<void> {
  const ownedAssemblyId = ownedAssemblies.get(billId);
  ownedAssemblies.delete(billId);
  if (ownedAssemblyId) {
    await cleanupTestAssembly(ownedAssemblyId);
    return;
  }
  await db.delete(bills).where(eq(bills.id, billId));
}

export async function createTestBillContent(
  billId: string,
  overrides: Partial<typeof bill_contents.$inferInsert> = {}
) {
  const [content] = await db
    .insert(bill_contents)
    .values({
      bill_id: billId,
      difficulty_level: "normal",
      title: `テスト議案タイトル ${Date.now()}`,
      summary: `テスト議案サマリー ${Date.now()}`,
      content: `# テスト議案コンテンツ ${Date.now()}`,
      ...overrides,
    })
    .returning();
  return content;
}

// ── 住民（匿名 ID）・管理画面のユーザー ──

export type TestUser = { id: string };

/** 住民の匿名 ID（本家の匿名ユーザーの代わり） */
export async function createTestUser(): Promise<TestUser> {
  const [visitor] = await db
    .insert(anonymous_visitors)
    .values({})
    .returning({ id: anonymous_visitors.id });
  return visitor;
}

export async function cleanupTestUser(userId: string): Promise<void> {
  await db.delete(anonymous_visitors).where(eq(anonymous_visitors.id, userId));
}

/** 管理画面の全体管理者 */
export async function createTestAdminUser(
  email = `${uniq("test-admin")}@example.com`,
  password = "test-password-123"
) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      password_hash: sql`crypt(${password}, gen_salt('bf'))`,
      is_super_admin: true,
      must_change_password: false,
    })
    .returning({ id: users.id });
  return { id: user.id, email, password };
}

export async function cleanupTestAdminUser(userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}

// ── インタビュー ──

/**
 * テスト用インタビューデータを一括作成
 * bill → interview_config → interview_session の階層
 */
export async function createTestInterviewData(userId: string) {
  const bill = await createTestBill();
  const config = await createTestInterviewConfig(bill.id);
  const session = await createTestInterviewSession(config.id, userId);
  return { bill, config, session };
}

export async function createTestInterviewConfig(
  billId: string,
  overrides: Partial<typeof interview_configs.$inferInsert> = {}
) {
  const [config] = await db
    .insert(interview_configs)
    .values({
      bill_id: billId,
      status: "public",
      name: `テスト設定 ${Date.now()}`,
      ...overrides,
    })
    .returning();
  return config;
}

export async function createTestInterviewSession(
  configId: string,
  userId: string,
  overrides: Partial<typeof interview_sessions.$inferInsert> = {}
) {
  const [session] = await db
    .insert(interview_sessions)
    .values({
      interview_config_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
      ...overrides,
    })
    .returning();
  return session;
}

export async function createTestInterviewReport(
  sessionId: string,
  overrides: Partial<typeof interview_report.$inferInsert> = {}
) {
  const [report] = await db
    .insert(interview_report)
    .values({ interview_session_id: sessionId, ...overrides })
    .returning();
  return report;
}

export async function createTestInterviewMessages(
  sessionId: string,
  count: number
) {
  return db
    .insert(interview_messages)
    .values(
      Array.from({ length: count }, (_, i) => ({
        interview_session_id: sessionId,
        role: (i % 2 === 0 ? "assistant" : "user") as "assistant" | "user",
        content: `テストメッセージ ${i + 1}`,
      }))
    )
    .returning();
}

// ── タグ・スタンス・プレビュー ──

export async function createTestTag(
  overrides: Partial<typeof tags.$inferInsert> = {}
) {
  const [tag] = await db
    .insert(tags)
    .values({ label: uniq("テストタグ"), ...overrides })
    .returning();
  return tag;
}

export async function cleanupTestTag(tagId: string): Promise<void> {
  await db.delete(tags).where(eq(tags.id, tagId));
}

export async function createTestBillTag(billId: string, tagId: string) {
  const [row] = await db
    .insert(bills_tags)
    .values({ bill_id: billId, tag_id: tagId })
    .returning();
  return row;
}

export async function createTestMiraiStance(
  billId: string,
  overrides: Partial<typeof mirai_stances.$inferInsert> = {}
) {
  const [stance] = await db
    .insert(mirai_stances)
    .values({
      bill_id: billId,
      type: "for",
      comment: "テストコメント",
      ...overrides,
    })
    .returning();
  return stance;
}

export async function createTestPreviewToken(
  billId: string,
  overrides: Partial<typeof preview_tokens.$inferInsert> = {}
) {
  const [token] = await db
    .insert(preview_tokens)
    .values({
      bill_id: billId,
      token: uniq("test-token"),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    })
    .returning();
  return token;
}
