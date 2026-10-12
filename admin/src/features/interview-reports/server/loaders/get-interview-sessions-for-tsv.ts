import "server-only";

import { createDb } from "@mirai-gikai/db";
import { asc, eq, inArray } from "@mirai-gikai/db/orm";
import { interview_messages, interview_sessions } from "@mirai-gikai/db/schema";
import type {
  InterviewMessage,
  InterviewReport,
  InterviewSession,
} from "../../shared/types";
import type { InterviewSessionForTsv } from "../../shared/utils/build-interview-tsv";
import { normalizeInterviewReport } from "../../shared/utils/normalize-interview-report";

const PAGE_SIZE = 1000;

async function fetchAllPaginated<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const page = await fetchPage(offset, offset + PAGE_SIZE - 1);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

type SessionWithReport = InterviewSession & {
  interview_report: InterviewReport | InterviewReport[] | null;
};

async function fetchAllSessions(
  configId: string
): Promise<SessionWithReport[]> {
  return fetchAllPaginated(async (from, to) =>
    createDb().query.interview_sessions.findMany({
      where: eq(interview_sessions.interview_config_id, configId),
      orderBy: asc(interview_sessions.started_at),
      offset: from,
      limit: to - from + 1,
      with: { interview_report: true },
    })
  );
}

async function fetchAllMessages(
  sessionIds: string[]
): Promise<InterviewMessage[]> {
  if (sessionIds.length === 0) return [];
  return fetchAllPaginated(async (from, to) =>
    createDb()
      .select()
      .from(interview_messages)
      .where(inArray(interview_messages.interview_session_id, sessionIds))
      .orderBy(
        asc(interview_messages.interview_session_id),
        asc(interview_messages.created_at)
      )
      .offset(from)
      .limit(to - from + 1)
  );
}

export async function getInterviewSessionsForTsv(
  configId: string
): Promise<InterviewSessionForTsv[]> {
  const sessions = await fetchAllSessions(configId);
  const messages = await fetchAllMessages(sessions.map((s) => s.id));

  const messagesBySessionId = new Map<string, InterviewMessage[]>();
  for (const message of messages) {
    const list = messagesBySessionId.get(message.interview_session_id);
    if (list) {
      list.push(message);
    } else {
      messagesBySessionId.set(message.interview_session_id, [message]);
    }
  }

  return sessions.map((session) => ({
    ...session,
    interview_report: normalizeInterviewReport(session.interview_report),
    interview_messages: messagesBySessionId.get(session.id) ?? [],
  }));
}
