import { assembly_factions, bill_faction_votes } from "@mirai-gikai/db/schema";
import {
  cleanupTestAssembly,
  cleanupTestTag,
  createTestAssembly,
  createTestBill,
  createTestBillContent,
  createTestBillTag,
  createTestInterviewConfig,
  createTestMiraiStance,
  createTestPreviewToken,
  createTestSession,
  createTestTag,
  db,
  uniq,
} from "@test-utils/utils";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  countPublishedBillsByCategory,
  countPublishedBillsBySession,
  findBillByKey,
  findBillContentByDifficulty,
  findBillIdsWithPublicInterview,
  findBillsWithPublicInterview,
  findComingSoonBills,
  findFactionVotesByBillId,
  findFeaturedTags,
  findMiraiStanceByBillId,
  findPreviewToken,
  findPublishedBillByKey,
  findPublishedBills,
  findPublishedBillsForSuggest,
  findTagsByBillId,
  findTagsByBillIds,
} from "./bill-repository";

/**
 * 公開側の議案リポジトリを実DBで検証する。
 * テストごとに専用の議会を作り、その議会の中だけで結果を確かめる
 * （ローカルDBのほかの議会の議案に影響されない）。
 */
describe("bill-repository 統合テスト", () => {
  let assemblyId: string;
  let sessionId: string;
  const tagIds: string[] = [];

  /** この議会・会期の議案を作る */
  function newBill(overrides: Parameters<typeof createTestBill>[0] = {}) {
    return createTestBill({
      assembly_id: assemblyId,
      session_id: sessionId,
      ...overrides,
    });
  }

  async function newTag(overrides: Parameters<typeof createTestTag>[0] = {}) {
    const tag = await createTestTag(overrides);
    tagIds.push(tag.id);
    return tag;
  }

  beforeAll(async () => {
    assemblyId = (await createTestAssembly()).id;
    sessionId = (await createTestSession(assemblyId)).id;
  });

  afterEach(async () => {
    for (const id of tagIds.splice(0)) await cleanupTestTag(id);
  });

  afterAll(async () => {
    await cleanupTestAssembly(assemblyId);
  });

  describe("findPublishedBills", () => {
    it("公開済み議案を指定した難易度の解説・タグ付きで返し、下書きは含めない", async () => {
      const published = await newBill({ publish_status: "published" });
      await createTestBillContent(published.id, {
        difficulty_level: "normal",
        title: "ふつう",
      });
      await createTestBillContent(published.id, {
        difficulty_level: "hard",
        title: "難しい",
      });
      const tag = await newTag();
      await createTestBillTag(published.id, tag.id);
      const draft = await newBill({ publish_status: "draft" });

      const rows = await findPublishedBills("normal", { assemblyId });
      const ids = rows.map((b) => b.id);
      expect(ids).toContain(published.id);
      expect(ids).not.toContain(draft.id);

      const row = rows.find((b) => b.id === published.id);
      expect(row?.bill_contents.map((c) => c.title)).toEqual(["ふつう"]);
      expect(row?.bills_tags.map((bt) => bt.tags.id)).toEqual([tag.id]);
    });

    it("件名のみの議案は解説が空のまま含まれる", async () => {
      const titleOnly = await newBill({
        publish_status: "published",
        publish_level: "title_only",
      });

      const rows = await findPublishedBills("normal", { assemblyId });
      const row = rows.find((b) => b.id === titleOnly.id);
      expect(row).toBeDefined();
      expect(row?.bill_contents).toEqual([]);
    });

    it("会期・注目・解説あり・タグ・ダミーで絞り込める", async () => {
      const otherSession = await createTestSession(assemblyId);
      const featured = await newBill({
        publish_status: "published",
        is_featured: true,
        publish_level: "explained",
      });
      const inOtherSession = await newBill({
        publish_status: "published",
        session_id: otherSession.id,
      });
      const dummy = await newBill({
        publish_status: "published",
        is_dummy: true,
      });
      const tag = await newTag();
      await createTestBillTag(featured.id, tag.id);

      const ids = async (
        filter: Partial<Parameters<typeof findPublishedBills>[1]>
      ) =>
        (await findPublishedBills("normal", { assemblyId, ...filter })).map(
          (b) => b.id
        );

      expect(await ids({ sessionId: otherSession.id })).toEqual([
        inOtherSession.id,
      ]);
      expect(await ids({ featuredOnly: true })).toEqual([featured.id]);
      expect(await ids({ explainedOnly: true })).toEqual([featured.id]);
      expect(await ids({ tagId: tag.id })).toEqual([featured.id]);
      expect(await ids({ excludeDummy: true })).not.toContain(dummy.id);
    });

    it("ほかの議会の議案は含めない", async () => {
      const otherAssembly = await createTestAssembly();
      try {
        const other = await createTestBill({
          assembly_id: otherAssembly.id,
          publish_status: "published",
        });
        const rows = await findPublishedBills("normal", { assemblyId });
        expect(rows.map((b) => b.id)).not.toContain(other.id);
      } finally {
        await cleanupTestAssembly(otherAssembly.id);
      }
    });
  });

  describe("findPublishedBillByKey / findBillByKey", () => {
    it("公開済み議案を id でも slug でも引ける", async () => {
      const slug = uniq("bill-slug");
      const bill = await newBill({ publish_status: "published", slug });

      expect((await findPublishedBillByKey(bill.id, assemblyId))?.id).toBe(
        bill.id
      );
      expect((await findPublishedBillByKey(slug, assemblyId))?.id).toBe(
        bill.id
      );
    });

    it("下書きは公開用では引けず、管理者用では引ける", async () => {
      const draft = await newBill({ publish_status: "draft" });

      expect(await findPublishedBillByKey(draft.id, assemblyId)).toBeNull();
      expect((await findBillByKey(draft.id, assemblyId))?.id).toBe(draft.id);
    });

    it("slug はほかの議会の同じ slug と取り違えない", async () => {
      const slug = uniq("shared-slug");
      const own = await newBill({ publish_status: "published", slug });
      const otherAssembly = await createTestAssembly();
      try {
        await createTestBill({
          assembly_id: otherAssembly.id,
          publish_status: "published",
          slug,
        });
        expect((await findPublishedBillByKey(slug, assemblyId))?.id).toBe(
          own.id
        );
      } finally {
        await cleanupTestAssembly(otherAssembly.id);
      }
    });

    it("存在しない議案では null を返す", async () => {
      expect(
        await findBillByKey("00000000-0000-0000-0000-000000000000", assemblyId)
      ).toBeNull();
    });
  });

  describe("findMiraiStanceByBillId", () => {
    it("議案のスタンスを返し、無ければ null", async () => {
      const withStance = await newBill();
      await createTestMiraiStance(withStance.id, {
        type: "against",
        comment: "反対",
      });
      const withoutStance = await newBill();

      expect((await findMiraiStanceByBillId(withStance.id))?.type).toBe(
        "against"
      );
      expect(await findMiraiStanceByBillId(withoutStance.id)).toBeNull();
    });
  });

  describe("findTagsByBillId / findTagsByBillIds", () => {
    it("議案のタグを取得でき、無ければ空配列", async () => {
      const bill = await newBill();
      const tag = await newTag();
      await createTestBillTag(bill.id, tag.id);
      const noTags = await newBill();

      expect((await findTagsByBillId(bill.id)).map((r) => r.tags.id)).toEqual([
        tag.id,
      ]);
      expect(await findTagsByBillId(noTags.id)).toEqual([]);
    });

    it("複数の議案のタグを一括で取得し、議案ごとにまとめる", async () => {
      const billA = await newBill();
      const billB = await newBill();
      const tag1 = await newTag();
      const tag2 = await newTag();
      await createTestBillTag(billA.id, tag1.id);
      await createTestBillTag(billA.id, tag2.id);
      await createTestBillTag(billB.id, tag2.id);

      const map = await findTagsByBillIds([billA.id, billB.id]);
      expect(
        map
          .get(billA.id)
          ?.map((t) => t.id)
          .sort()
      ).toEqual([tag1.id, tag2.id].sort());
      expect(map.get(billB.id)?.map((t) => t.id)).toEqual([tag2.id]);
      expect((await findTagsByBillIds([])).size).toBe(0);
    });
  });

  describe("findFactionVotesByBillId", () => {
    it("会派ごとの賛否を会派名順で返す", async () => {
      const bill = await newBill();
      const factions = await db
        .insert(assembly_factions)
        .values([
          { assembly_id: assemblyId, name: "い会派", valid_from: "2020-01-01" },
          { assembly_id: assemblyId, name: "あ会派", valid_from: "2020-01-01" },
        ])
        .returning({ id: assembly_factions.id, name: assembly_factions.name });
      await db.insert(bill_faction_votes).values(
        factions.map((f) => ({
          bill_id: bill.id,
          faction_id: f.id,
          vote: f.name === "あ会派" ? ("for" as const) : ("against" as const),
        }))
      );

      const votes = await findFactionVotesByBillId(bill.id);
      expect(votes.map((v) => [v.faction_name, v.vote])).toEqual([
        ["あ会派", "for"],
        ["い会派", "against"],
      ]);
    });
  });

  describe("findBillContentByDifficulty", () => {
    it("指定した難易度の解説を返し、無ければ null", async () => {
      const bill = await newBill();
      await createTestBillContent(bill.id, {
        difficulty_level: "normal",
        title: "ふつう",
      });

      expect(
        (await findBillContentByDifficulty(bill.id, "normal"))?.title
      ).toBe("ふつう");
      expect(await findBillContentByDifficulty(bill.id, "hard")).toBeNull();
    });
  });

  describe("countPublishedBillsBySession / countPublishedBillsByCategory", () => {
    it("公開済み議案だけを会期ごと・種類ごとに数える", async () => {
      const assembly = await createTestAssembly();
      try {
        const session = await createTestSession(assembly.id);
        const base = { assembly_id: assembly.id, session_id: session.id };
        await createTestBill({
          ...base,
          publish_status: "published",
          category: "budget",
        });
        await createTestBill({
          ...base,
          publish_status: "published",
          category: "ordinance",
        });
        await createTestBill({
          ...base,
          publish_status: "draft",
          category: "budget",
        });

        const bySession = await countPublishedBillsBySession(assembly.id);
        expect(bySession.get(session.id)).toBe(2);

        const byCategory = await countPublishedBillsByCategory(assembly.id);
        expect(
          Object.fromEntries(byCategory.map((r) => [r.category, r.count]))
        ).toEqual({ budget: 1, ordinance: 1 });
      } finally {
        await cleanupTestAssembly(assembly.id);
      }
    });
  });

  describe("findFeaturedTags", () => {
    it("featured_priority のあるタグだけを優先度・label 順で返す", async () => {
      const second = await newTag({
        label: uniq("b"),
        featured_priority: -100,
      });
      const first = await newTag({ label: uniq("a"), featured_priority: -100 });
      const top = await newTag({ featured_priority: -200 });
      const notFeatured = await newTag();

      const result = (await findFeaturedTags()) ?? [];
      const mine = result
        .map((t) => t.id)
        .filter((id) => [second.id, first.id, top.id].includes(id));
      expect(mine).toEqual([top.id, first.id, second.id]);
      expect(result.map((t) => t.id)).not.toContain(notFeatured.id);
    });
  });

  describe("findPublishedBillsForSuggest", () => {
    it("公開済み議案の名称・タイトル・タグを返し、下書きは含めない", async () => {
      const bill = await newBill({ publish_status: "published" });
      await createTestBillContent(bill.id, { title: "候補タイトル" });
      const draft = await newBill({ publish_status: "draft" });

      const rows = await findPublishedBillsForSuggest(assemblyId, "normal");
      const row = rows.find((r) => r.id === bill.id);
      expect(row?.bill_contents.map((c) => c.title)).toEqual(["候補タイトル"]);
      expect(rows.map((r) => r.id)).not.toContain(draft.id);
    });
  });

  describe("findBillsWithPublicInterview / findBillIdsWithPublicInterview", () => {
    it("公開中のインタビュー設定がある公開済み議案だけを返す", async () => {
      const open = await newBill({ publish_status: "published" });
      await createTestInterviewConfig(open.id, { status: "public" });
      await createTestBillContent(open.id, { content: "本文" });
      const closed = await newBill({ publish_status: "published" });
      await createTestInterviewConfig(closed.id, { status: "closed" });
      const draft = await newBill({ publish_status: "draft" });
      await createTestInterviewConfig(draft.id, { status: "public" });

      const rows = await findBillsWithPublicInterview(assemblyId, "normal");
      expect(rows.map((b) => b.id)).toEqual([open.id]);
      // 解説本文（content）は取得しない
      expect(rows[0].bill_contents[0]).not.toHaveProperty("content");

      const ids = await findBillIdsWithPublicInterview([
        open.id,
        closed.id,
        draft.id,
      ]);
      expect([...ids].sort()).toEqual([open.id, draft.id].sort());
      expect((await findBillIdsWithPublicInterview([])).size).toBe(0);
    });
  });

  describe("findComingSoonBills", () => {
    it("coming_soon の議案だけを会期で絞って返す", async () => {
      const otherSession = await createTestSession(assemblyId);
      const comingSoon = await newBill({ publish_status: "coming_soon" });
      const otherComingSoon = await newBill({
        publish_status: "coming_soon",
        session_id: otherSession.id,
      });
      const published = await newBill({ publish_status: "published" });

      const inSession = await findComingSoonBills(assemblyId, sessionId);
      expect(inSession.map((b) => b.id)).toContain(comingSoon.id);
      expect(inSession.map((b) => b.id)).not.toContain(otherComingSoon.id);
      expect(inSession.map((b) => b.id)).not.toContain(published.id);

      const all = await findComingSoonBills(assemblyId, null);
      expect(all.map((b) => b.id)).toEqual(
        expect.arrayContaining([comingSoon.id, otherComingSoon.id])
      );
    });
  });

  describe("findPreviewToken", () => {
    it("議案とトークンが一致するときだけ返す", async () => {
      const bill = await newBill();
      const other = await newBill();
      const token = await createTestPreviewToken(bill.id);

      expect(await findPreviewToken(bill.id, token.token)).not.toBeNull();
      expect(await findPreviewToken(bill.id, uniq("missing"))).toBeNull();
      expect(await findPreviewToken(other.id, token.token)).toBeNull();
    });
  });
});
