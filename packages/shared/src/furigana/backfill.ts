/**
 * ふりがなが付いていない議案の件名・解説の本文に、ふりがなを付ける。
 * ふりがなはふつう保存するとき（管理画面・CSV 取り込み）に作るが、
 * SQL で直接入れた議案には付かないので、あとからまとめて付けるのに使う。
 * 付いているもの（管理画面で読みを直したものを含む）は変えない。
 */
import type { Db, FuriganaSegment, Tx } from "@mirai-gikai/db";
import { and, eq, isNull, ne } from "@mirai-gikai/db/orm";
import { assemblies, bill_contents, bills } from "@mirai-gikai/db/schema";
import { toFurigana, toFuriganaMultiline } from "./generate";

export type BackfillFuriganaOptions = {
  /** この議会（スラッグ）の議案だけにする。省略するとすべての議会 */
  assemblySlug?: string;
  /** 件数を数えるだけで、書き込まない */
  dryRun?: boolean;
  name?: (text: string) => Promise<FuriganaSegment[]>;
  content?: (text: string) => Promise<FuriganaSegment[]>;
};

export type BackfillFuriganaResult = {
  /** 件名にふりがなを付けた議案の数 */
  billNames: number;
  /** 本文にふりがなを付けた解説の数 */
  contents: number;
};

export async function backfillFurigana(
  db: Db | Tx,
  options: BackfillFuriganaOptions = {}
): Promise<BackfillFuriganaResult> {
  const {
    assemblySlug,
    dryRun = false,
    name = toFurigana,
    content = toFuriganaMultiline,
  } = options;
  const inAssembly = assemblySlug
    ? eq(assemblies.slug, assemblySlug)
    : undefined;

  const targetBills = await db
    .select({ id: bills.id, name: bills.name })
    .from(bills)
    .innerJoin(assemblies, eq(assemblies.id, bills.assembly_id))
    .where(and(isNull(bills.name_furigana), inAssembly));

  const targetContents = await db
    .select({ id: bill_contents.id, content: bill_contents.content })
    .from(bill_contents)
    .innerJoin(bills, eq(bills.id, bill_contents.bill_id))
    .innerJoin(assemblies, eq(assemblies.id, bills.assembly_id))
    .where(
      and(
        isNull(bill_contents.furigana),
        ne(bill_contents.content, ""),
        inAssembly
      )
    );

  if (!dryRun) {
    for (const bill of targetBills) {
      await db
        .update(bills)
        .set({ name_furigana: await name(bill.name) })
        .where(eq(bills.id, bill.id));
    }
    for (const row of targetContents) {
      await db
        .update(bill_contents)
        .set({ furigana: await content(row.content) })
        .where(eq(bill_contents.id, row.id));
    }
  }

  return { billNames: targetBills.length, contents: targetContents.length };
}
