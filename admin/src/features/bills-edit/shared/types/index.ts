import type { Database } from "@mirai-gikai/db";
import { z } from "zod";

// 既存の型を再利用
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type BillUpdate = Database["public"]["Tables"]["bills"]["Update"];
export type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];

// 公開ステータス型
export type BillPublishStatus = "draft" | "published" | "coming_soon";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label}は${max}文字以内で入力してください`)
    .transform((val) => (val.trim() === "" ? null : val.trim()))
    .nullable()
    .optional();

const optionalUrl = z
  .string()
  .transform((val) => (val.trim() === "" ? null : val.trim()))
  .nullable()
  .refine((val) => val === null || /^https?:\/\//.test(val), {
    message: "有効なURLを入力してください",
  })
  .optional();

/**
 * 議案の入力。議会は URL で決まるので入力に含めない。
 */
const billBaseSchema = z.object({
  session_id: z.string().uuid("会期を選択してください"),
  bill_number: z
    .string()
    .trim()
    .min(1, "議案番号は必須です")
    .max(50, "議案番号は50文字以内で入力してください"),
  official_name: z
    .string()
    .trim()
    .min(1, "正式名称は必須です")
    .max(500, "正式名称は500文字以内で入力してください"),
  // 表示用タイトル。空なら正式名称を使う
  name: z.string().max(200, "表示用タイトルは200文字以内で入力してください"),
  category: z.enum([
    "budget",
    "ordinance",
    "personnel",
    "contract",
    "petition",
    "report",
    "other",
  ]),
  submitter: optionalText(100, "提出者"),
  submitted_date: z
    .string()
    .refine(
      (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
      "提出日は YYYY-MM-DD 形式で入力してください"
    )
    .optional(),
  committee_name: optionalText(100, "付託委員会"),
  status: z.enum([
    "preparing",
    "introduced",
    "referred_to_committee",
    "decided",
    "continued",
    "withdrawn",
  ]),
  status_note: optionalText(500, "状態の補足"),
  source_url: optionalUrl,
  materials_url: optionalUrl,
  source_pages: optionalText(50, "ページ範囲"),
  publish_level: z.enum(["title_only", "explained"]),
  thumbnail_url: z.string().nullable().optional(),
  share_thumbnail_url: z.string().nullable().optional(),
  is_featured: z.boolean(),
  is_review_completed: z.boolean(),
  slug: z
    .string()
    .max(200, "slugは200文字以内で入力してください")
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine((val) => val === null || /^[a-z0-9-]+$/.test(val), {
      message: "slugは半角英小文字・数字・ハイフンで入力してください",
    })
    .optional(),
  knowledge_source: z
    .string()
    .max(40_000, "ナレッジソースは40,000文字以内で入力してください")
    .optional(),
  use_knowledge_source_in_chat: z.boolean().optional(),
});

// 更新用スキーマ
export const billUpdateSchema = billBaseSchema;
export type BillUpdateInput = z.infer<typeof billUpdateSchema>;
export type BillFormValues = z.input<typeof billBaseSchema>;

// 新規作成用スキーマ
export const billCreateSchema = billBaseSchema;
export type BillCreateInput = z.infer<typeof billCreateSchema>;
