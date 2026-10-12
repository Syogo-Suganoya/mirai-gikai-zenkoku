import type { Database } from "@mirai-gikai/db";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  findLatestInterviewConfigByBillId,
  findPublicInterviewConfigByBillId,
} from "../repositories/interview-config-repository";

export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];

/**
 * 管理者用のインタビュー設定取得
 * 複数設定がある場合は、公開設定を優先し、なければ最新の設定を返す
 */
export async function getInterviewConfigAdmin(
  billId: string
): Promise<InterviewConfig | null> {
  return _getCachedInterviewConfigAdmin(billId);
}

const _getCachedInterviewConfigAdmin = unstable_cache(
  async (billId: string): Promise<InterviewConfig | null> => {
    try {
      // まず公開設定を探し、なければ最新の更新日の設定を返す
      return (
        (await findPublicInterviewConfigByBillId(billId)) ??
        (await findLatestInterviewConfigByBillId(billId))
      );
    } catch (error) {
      console.error("Failed to fetch interview config (admin):", error);
      return null;
    }
  },
  ["interview-config-admin"],
  {
    revalidate: 60, // 非公開設定をプレビューするので短めに
    tags: [CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
