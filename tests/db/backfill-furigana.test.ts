import { eq } from "@mirai-gikai/db/orm";
import { bill_contents, bills } from "@mirai-gikai/db/schema";
import { backfillFurigana } from "@mirai-gikai/shared/furigana/backfill";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupTestAssembly,
  createTestAssembly,
  createTestBill,
  createTestBillContent,
  createTestSession,
  db,
} from "./utils";

// 形態素解析（kuromoji）を使わず、呼ばれた文字列が分かる形にする
const fakeName = async (text: string) => [{ text, reading: "けんめい" }];
const fakeContent = async (text: string) => [{ text, reading: "ほんぶん" }];

describe("backfillFurigana", () => {
  let assemblyId: string;
  let assemblySlug: string;
  let sessionId: string;

  beforeEach(async () => {
    const assembly = await createTestAssembly();
    assemblyId = assembly.id;
    assemblySlug = assembly.slug;
    sessionId = (await createTestSession(assemblyId)).id;
  });

  afterEach(async () => {
    await cleanupTestAssembly(assemblyId);
  });

  it("ふりがなが無い件名・本文にだけ付け、付いているものは変えない", async () => {
    const missing = await createTestBill({
      assembly_id: assemblyId,
      session_id: sessionId,
      name: "条例の制定",
    });
    const existing = await createTestBill({
      assembly_id: assemblyId,
      session_id: sessionId,
      name: "予算",
      name_furigana: [{ text: "予算", reading: "なおしたよみ" }],
    });
    const content = await createTestBillContent(missing.id, {
      content: "本文です",
    });

    const result = await backfillFurigana(db, {
      assemblySlug,
      name: fakeName,
      content: fakeContent,
    });

    expect(result).toEqual({ billNames: 1, contents: 1 });
    const [filled] = await db
      .select({ f: bills.name_furigana })
      .from(bills)
      .where(eq(bills.id, missing.id));
    expect(filled.f).toEqual([{ text: "条例の制定", reading: "けんめい" }]);
    const [kept] = await db
      .select({ f: bills.name_furigana })
      .from(bills)
      .where(eq(bills.id, existing.id));
    expect(kept.f).toEqual([{ text: "予算", reading: "なおしたよみ" }]);
    const [filledContent] = await db
      .select({ f: bill_contents.furigana })
      .from(bill_contents)
      .where(eq(bill_contents.id, content.id));
    expect(filledContent.f).toEqual([
      { text: "本文です", reading: "ほんぶん" },
    ]);

    // もう一度流しても対象は無い
    expect(
      await backfillFurigana(db, {
        assemblySlug,
        name: fakeName,
        content: fakeContent,
      })
    ).toEqual({ billNames: 0, contents: 0 });
  });

  it("dryRun では数えるだけで書き込まない", async () => {
    const bill = await createTestBill({
      assembly_id: assemblyId,
      session_id: sessionId,
    });

    const result = await backfillFurigana(db, {
      assemblySlug,
      dryRun: true,
      name: fakeName,
      content: fakeContent,
    });

    expect(result.billNames).toBe(1);
    const [row] = await db
      .select({ f: bills.name_furigana })
      .from(bills)
      .where(eq(bills.id, bill.id));
    expect(row.f).toBeNull();
  });

  it("ほかの議会の議案には触れない", async () => {
    const other = await createTestAssembly();
    try {
      const bill = await createTestBill({ assembly_id: other.id });
      await backfillFurigana(db, {
        assemblySlug,
        name: fakeName,
        content: fakeContent,
      });
      const [row] = await db
        .select({ f: bills.name_furigana })
        .from(bills)
        .where(eq(bills.id, bill.id));
      expect(row.f).toBeNull();
    } finally {
      await cleanupTestAssembly(other.id);
    }
  });
});
