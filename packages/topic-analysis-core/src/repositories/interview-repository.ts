import { createDb } from "@mirai-gikai/db";
import { asc, eq } from "@mirai-gikai/db/orm";
import {
  bill_contents,
  bills,
  interview_configs,
  interview_messages,
  interview_sessions,
} from "@mirai-gikai/db/schema";

/**
 * インタビュー設定を取得する。再抽出のプロンプト構築に使う。
 * 存在しなければ null。
 */
export async function findInterviewConfigById(configId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_configs)
    .where(eq(interview_configs.id, configId));
  return row ?? null;
}

/** インタビューセッションを取得する。存在しなければ null（呼び出し側でスキップ判定）。 */
export async function findInterviewSessionById(sessionId: string) {
  const [row] = await createDb()
    .select()
    .from(interview_sessions)
    .where(eq(interview_sessions.id, sessionId));
  return row ?? null;
}

/** セッションの全メッセージを作成順で取得する。 */
export async function findInterviewMessagesBySessionId(sessionId: string) {
  return createDb()
    .select()
    .from(interview_messages)
    .where(eq(interview_messages.interview_session_id, sessionId))
    .orderBy(asc(interview_messages.created_at));
}

/**
 * 議案と bill_contents（normal 優先）を取得し、プロンプト接地用に整形する。
 */
export async function fetchBillWithContents(billId: string) {
  const db = createDb();
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) {
    throw new Error(`Failed to fetch bill: ${billId} not found`);
  }

  const contents = await db
    .select()
    .from(bill_contents)
    .where(eq(bill_contents.bill_id, billId));

  const normalContent = contents.find((c) => c.difficulty_level === "normal");

  return {
    bill,
    billTitle: normalContent?.title ?? bill.name,
    billContent: normalContent?.content ?? "",
    billSummary: normalContent?.summary ?? "",
  };
}

/**
 * 議案名だけを引く。
 * タグ付けはレポートごとに並列で走るため、議案本文まで取る fetchBillWithContents は
 * 使わない（使うのは name 1カラムだけ）。
 */
export async function findBillNameById(billId: string): Promise<string | null> {
  const [row] = await createDb()
    .select({ name: bills.name })
    .from(bills)
    .where(eq(bills.id, billId));
  return row?.name ?? null;
}
