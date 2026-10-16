import type {
  BillContent,
  BillStatusEnum,
  BillWithContent,
} from "@/features/bills/shared/types";

export const allBillStatuses: BillStatusEnum[] = [
  "preparing",
  "introduced",
  "referred_to_committee",
  "decided",
  "continued",
  "withdrawn",
];

export function createMockBillContent(
  overrides: Partial<BillContent> = {}
): BillContent {
  return {
    id: "mock-content-001",
    bill_id: "mock-bill-001",
    title: "サンプル議案のタイトル",
    summary:
      "この議案は開発プレビュー用のサンプルデータです。議案の要約文がここに表示されます。実際のデータではありません。",
    content: "# サンプルコンテンツ\n\n本文がここに入ります。",
    difficulty_level: "normal",
    furigana: null,
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-02-15T00:00:00Z",
    ...overrides,
  };
}

const baseBill: BillWithContent = {
  id: "mock-bill-001",
  assembly_id: "mock-assembly",
  assembly_slug: "aichi-pref",
  session_id: "mock-session",
  bill_number: "第1号議案",
  name: "サンプル条例の一部を改正する条例",
  name_furigana: null,
  official_name: "サンプル条例の一部を改正する条例",
  category: "ordinance",
  committee_name: "総務企画委員会",
  submitter: "知事",
  submitted_date: "2026-02-15",
  status: "referred_to_committee",
  status_note: null,
  source_url: null,
  materials_url: null,
  source_needs_update: false,
  source_file_path: null,
  source_pages: null,
  publish_level: "explained",
  review_priority: null,
  reviewed_by: null,
  reviewed_at: null,
  is_dummy: false,
  slug: null,
  publish_status: "published",
  published_at: "2026-02-15",
  is_featured: false,
  is_review_completed: true,
  knowledge_source: null,
  use_knowledge_source_in_chat: false,
  thumbnail_url: null,
  share_thumbnail_url: null,
  status_order: 3,
  publish_status_order: 2,
  created_at: "2026-02-15T00:00:00Z",
  updated_at: "2026-02-15T00:00:00Z",
  bill_content: createMockBillContent(),
  tags: [
    { id: "tag-1", label: "経済" },
    { id: "tag-2", label: "環境" },
  ],
};

export function createMockBill(
  overrides: Partial<BillWithContent> = {}
): BillWithContent {
  return {
    ...baseBill,
    ...overrides,
  };
}
