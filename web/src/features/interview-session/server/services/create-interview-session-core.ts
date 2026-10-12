import "server-only";

import { getCurrentVisitor } from "@/lib/visitor/server";
import type { InterviewSession } from "../../shared/types";
import { createInterviewSessionRecord } from "../repositories/interview-session-repository";
import type { LoaderDeps } from "../utils/verify-session-ownership";

/**
 * インタビューセッション作成のコアロジック
 * テストからはDIで認証を差し替え可能
 */
export async function createInterviewSessionCore({
  interviewConfigId,
  deps,
}: {
  interviewConfigId: string;
  deps?: LoaderDeps;
}): Promise<InterviewSession> {
  const getUser = deps?.getUser ?? getCurrentVisitor;
  const {
    data: { user },
    error: getUserError,
  } = await getUser();

  if (getUserError || !user) {
    throw new Error(
      `Failed to get user: ${getUserError?.message || "User not found"}`
    );
  }

  return await createInterviewSessionRecord({
    interviewConfigId,
    userId: user.id,
  });
}
