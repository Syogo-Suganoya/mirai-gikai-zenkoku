import "server-only";

import { createDb } from "@mirai-gikai/db";
import { sql } from "@mirai-gikai/db/orm";
import { anonymous_visitors } from "@mirai-gikai/db/schema";
import { cookies } from "next/headers";
import {
  getVisitorSecret,
  VISITOR_COOKIE_NAME,
  verifyVisitorToken,
} from "./visitor-token";

/** Cookie の匿名 ID を検証して返す（DB には触らない） */
export async function getCurrentVisitorId(): Promise<string | null> {
  const token = (await cookies()).get(VISITOR_COOKIE_NAME)?.value;
  return verifyVisitorToken(token, getVisitorSecret());
}

/**
 * 現在の住民（匿名）を返す。anonymous_visitors に行がなければ作る。
 *
 * 本家の `supabase.auth.getUser()` と同じ `{ data: { user }, error }` の形で返すので、
 * 認証関数を DI している箇所（GetUserFn）にそのまま渡せる。
 */
export async function getCurrentVisitor(): Promise<{
  data: { user: { id: string } | null };
  error: Error | null;
}> {
  const visitorId = await getCurrentVisitorId();
  if (!visitorId) {
    return { data: { user: null }, error: null };
  }

  await createDb()
    .insert(anonymous_visitors)
    .values({ id: visitorId })
    .onConflictDoUpdate({
      target: anonymous_visitors.id,
      set: { last_seen_at: sql`now()` },
    });

  return { data: { user: { id: visitorId } }, error: null };
}
