import { describe, expect, it } from "vitest";
import type { Bill } from "../types";
import { BILL_STATUS_ORDER } from "../types";
import {
  prepareBillContentsForDuplication,
  prepareBillForDuplication,
} from "./prepare-bill-for-duplication";

const baseBill: Bill = {
  id: "bill-001",
  assembly_id: "assembly-001",
  session_id: "session-001",
  bill_number: "議案第1号",
  name: "テスト議案",
  name_furigana: null,
  official_name: "テスト条例の一部を改正する条例",
  category: "ordinance",
  committee_name: null,
  submitter: "知事",
  submitted_date: null,
  status: "introduced",
  status_note: null,
  source_url: null,
  source_file_path: null,
  source_pages: null,
  publish_level: "title_only",
  review_priority: null,
  reviewed_by: "user-001",
  reviewed_at: "2025-01-02T00:00:00Z",
  is_dummy: true,
  slug: null,
  publish_status: "published",
  published_at: "2025-01-02T00:00:00Z",
  is_featured: true,
  is_review_completed: true,
  knowledge_source: null,
  use_knowledge_source_in_chat: false,
  thumbnail_url: null,
  share_thumbnail_url: null,
  status_order: BILL_STATUS_ORDER.introduced,
  publish_status_order: 2,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
};

describe("prepareBillForDuplication", () => {
  it("id, created_at, updated_atを除去する", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("created_at");
    expect(result).not.toHaveProperty("updated_at");
  });

  it("名前に「(複製)」を付与する", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result.name).toBe("テスト議案 (複製)");
  });

  it("publish_statusをdraftに設定する", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result.publish_status).toBe("draft");
  });

  it("is_review_completedをfalseにリセットする", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result.is_review_completed).toBe(false);
  });

  it("slugをnullにリセットする", () => {
    const billWithSlug = { ...baseBill, slug: "test-slug" };
    const result = prepareBillForDuplication(billWithSlug);
    expect(result.slug).toBeNull();
  });

  it("議案番号に「(複製)」を付与する（会期内で一意のため）", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result.bill_number).toBe("議案第1号 (複製)");
  });

  it("公開日時・確認者・ダミーの目印・生成列を引き継がない", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result.published_at).toBeNull();
    expect(result.reviewed_by).toBeNull();
    expect(result.reviewed_at).toBeNull();
    expect(result.is_dummy).toBe(false);
    expect(result).not.toHaveProperty("status_order");
    expect(result).not.toHaveProperty("publish_status_order");
  });

  it("その他のフィールドを保持する", () => {
    const result = prepareBillForDuplication(baseBill);
    expect(result.session_id).toBe("session-001");
    expect(result.assembly_id).toBe("assembly-001");
    expect(result.category).toBe("ordinance");
    expect(result.is_featured).toBe(true);
  });
});

describe("prepareBillContentsForDuplication", () => {
  const contents = [
    {
      id: "content-001",
      bill_id: "bill-001",
      title: "概要",
      content: "内容1",
      summary: "要約1",
      difficulty_level: "easy" as const,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    {
      id: "content-002",
      bill_id: "bill-001",
      title: "詳細",
      content: "内容2",
      summary: "要約2",
      difficulty_level: "normal" as const,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  ];

  it("id, bill_idを除去し新しいbill_idを設定する", () => {
    const result = prepareBillContentsForDuplication(contents, "new-bill-id");
    for (const item of result) {
      expect(item).not.toHaveProperty("id");
      expect(item.bill_id).toBe("new-bill-id");
    }
  });

  it("元のコンテンツデータを保持する", () => {
    const result = prepareBillContentsForDuplication(contents, "new-bill-id");
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("概要");
    expect(result[0].content).toBe("内容1");
    expect(result[1].title).toBe("詳細");
    expect(result[1].content).toBe("内容2");
  });

  it("空配列を渡すと空配列を返す", () => {
    const result = prepareBillContentsForDuplication([], "new-bill-id");
    expect(result).toEqual([]);
  });
});
