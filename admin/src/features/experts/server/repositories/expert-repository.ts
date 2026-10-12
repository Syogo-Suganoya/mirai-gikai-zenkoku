import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, desc, inArray, isNotNull } from "@mirai-gikai/db/orm";
import {
  expert_registrations,
  interview_sessions,
} from "@mirai-gikai/db/schema";

export async function findExpertRegistrations() {
  return createDb()
    .select({
      id: expert_registrations.id,
      name: expert_registrations.name,
      email: expert_registrations.email,
      affiliation: expert_registrations.affiliation,
      created_at: expert_registrations.created_at,
      user_id: expert_registrations.user_id,
    })
    .from(expert_registrations)
    .orderBy(desc(expert_registrations.created_at));
}

export async function findCompletedSessionsWithReportsByUserIds(
  userIds: string[]
) {
  if (userIds.length === 0) return [];

  return createDb().query.interview_sessions.findMany({
    columns: { id: true, user_id: true },
    where: and(
      inArray(interview_sessions.user_id, userIds),
      isNotNull(interview_sessions.completed_at)
    ),
    with: {
      interview_report: { columns: { id: true, stance: true } },
      interview_configs: {
        columns: { id: true, bill_id: true },
        with: { bills: { columns: { id: true, name: true } } },
      },
    },
  });
}
