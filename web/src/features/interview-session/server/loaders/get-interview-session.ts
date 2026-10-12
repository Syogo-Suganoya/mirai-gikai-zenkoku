import "server-only";

import { getCurrentVisitor } from "@/lib/visitor/server";
import type { InterviewSession } from "../../shared/types";
import { findActiveInterviewSession } from "../repositories/interview-session-repository";
import type { LoaderDeps } from "../utils/verify-session-ownership";

export async function getInterviewSession(
  interviewConfigId: string,
  deps?: LoaderDeps
): Promise<InterviewSession | null> {
  // 認可処理: バックエンド側でuserIdを取得
  const getUser = deps?.getUser ?? getCurrentVisitor;
  const {
    data: { user },
    error: getUserError,
  } = await getUser();

  if (getUserError || !user) {
    console.error("Failed to get user:", getUserError);
    return null;
  }

  try {
    return await findActiveInterviewSession(interviewConfigId, user.id);
  } catch (error) {
    console.error("Failed to fetch interview session:", error);
    return null;
  }
}
