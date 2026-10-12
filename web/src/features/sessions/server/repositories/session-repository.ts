import "server-only";

import { createDb } from "@mirai-gikai/db";
import { and, desc, eq } from "@mirai-gikai/db/orm";
import { sessions } from "@mirai-gikai/db/schema";
import type { Session } from "../../shared/types";

/** 議会の会期を新しい順にすべて取得する（1議会あたり年に数件なので全件で足りる） */
export async function findSessionsByAssembly(
  assemblyId: string
): Promise<Session[]> {
  return createDb()
    .select()
    .from(sessions)
    .where(eq(sessions.assembly_id, assemblyId))
    .orderBy(desc(sessions.start_date));
}

/** 議会内のスラッグ（なければ会期キー）で会期を取得する */
export async function findSessionBySlug(
  assemblyId: string,
  slug: string
): Promise<Session | null> {
  const db = createDb();
  const [bySlug] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.assembly_id, assemblyId), eq(sessions.slug, slug)));
  if (bySlug) return bySlug;
  const [byKey] = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.assembly_id, assemblyId), eq(sessions.session_key, slug))
    );
  return byKey ?? null;
}
