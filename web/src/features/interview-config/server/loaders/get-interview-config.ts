import type { Database } from "@mirai-gikai/db";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findPublicInterviewConfigByBillId } from "../repositories/interview-config-repository";

export type InterviewConfig =
  Database["public"]["Tables"]["interview_configs"]["Row"];

export async function getInterviewConfig(
  billId: string
): Promise<InterviewConfig | null> {
  return _getCachedInterviewConfig(billId);
}

const _getCachedInterviewConfig = unstable_cache(
  async (billId: string): Promise<InterviewConfig | null> => {
    try {
      return await findPublicInterviewConfigByBillId(billId);
    } catch (error) {
      console.error("Failed to fetch interview config:", error);
      return null;
    }
  },
  ["interview-config"],
  {
    revalidate: 600, // 10分（600秒）
    tags: [CACHE_TAGS.INTERVIEW_CONFIGS],
  }
);
