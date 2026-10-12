import { eq } from "@mirai-gikai/db/orm";
import { interview_sessions } from "@mirai-gikai/db/schema";
import {
  cleanupTestBill,
  cleanupTestUser,
  createTestInterviewData,
  createTestUser,
  db,
  type TestUser,
} from "@test-utils/utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GetUserFn } from "../utils/verify-session-ownership";
import { getLatestInterviewSession } from "./get-latest-interview-session";

function createGetUser(userId: string): GetUserFn {
  return async () => ({
    data: { user: { id: userId } },
    error: null,
  });
}

const getUnauthenticatedUser: GetUserFn = async () => ({
  data: { user: null },
  error: new Error("Not authenticated"),
});

describe("getLatestInterviewSession 統合テスト", () => {
  let testUser: TestUser;
  let sessionId: string;
  let billId: string;
  let interviewConfigId: string;

  beforeEach(async () => {
    testUser = await createTestUser();
    const data = await createTestInterviewData(testUser.id);
    sessionId = data.session.id;
    billId = data.bill.id;
    interviewConfigId = data.config.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("進行中セッションを active として返す", async () => {
    const result = await getLatestInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(sessionId);
    expect(result?.status).toBe("active");
    expect(result?.reportId).toBeNull();
  });

  it("完了済みセッションを completed として返す", async () => {
    await db
      .update(interview_sessions)
      .set({ completed_at: new Date().toISOString() })
      .where(eq(interview_sessions.id, sessionId));

    const result = await getLatestInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe(sessionId);
    expect(result?.status).toBe("completed");
  });

  it("未認証の場合はnullを返す", async () => {
    const result = await getLatestInterviewSession(interviewConfigId, {
      getUser: getUnauthenticatedUser,
    });

    expect(result).toBeNull();
  });

  it("セッションが存在しない場合はnullを返す", async () => {
    const result = await getLatestInterviewSession(
      "00000000-0000-0000-0000-000000000000",
      { getUser: createGetUser(testUser.id) }
    );

    expect(result).toBeNull();
  });

  it("アーカイブ済みセッションはnullを返す", async () => {
    await db
      .update(interview_sessions)
      .set({ archived_at: new Date().toISOString() })
      .where(eq(interview_sessions.id, sessionId));

    const result = await getLatestInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result).toBeNull();
  });

  it("複数セッションがある場合は最新を返す", async () => {
    // 古いセッションをアーカイブして新しいセッションを作成
    await db
      .update(interview_sessions)
      .set({ archived_at: new Date().toISOString() })
      .where(eq(interview_sessions.id, sessionId));

    const [newSession] = await db
      .insert(interview_sessions)
      .values({
        interview_config_id: interviewConfigId,
        user_id: testUser.id,
        started_at: new Date().toISOString(),
      })
      .returning();

    expect(newSession).not.toBeNull();

    const result = await getLatestInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(result?.id).toBe(newSession?.id);
    expect(result?.status).toBe("active");
  });
});
