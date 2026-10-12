import { inArray, sql } from "@mirai-gikai/db/orm";
import { sessions } from "@mirai-gikai/db/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupTestAssembly,
  createTestAssembly,
  createTestSession,
  db,
} from "../utils";

async function setActive(assemblyId: string, sessionId: string) {
  await db.execute(
    sql`select set_active_session(${assemblyId}::uuid, ${sessionId}::uuid)`
  );
}

async function activeMap(ids: string[]) {
  const data = await db
    .select({ id: sessions.id, is_active: sessions.is_active })
    .from(sessions)
    .where(inArray(sessions.id, ids));
  return new Map(data.map((d) => [d.id, d.is_active]));
}

describe("set_active_session() 関数", () => {
  let assemblyIds: string[] = [];

  beforeEach(() => {
    assemblyIds = [];
  });

  afterEach(async () => {
    for (const id of assemblyIds) {
      await cleanupTestAssembly(id);
    }
  });

  async function newAssembly() {
    const assembly = await createTestAssembly();
    assemblyIds.push(assembly.id);
    return assembly.id;
  }

  it("指定したセッションのみ active になる", async () => {
    const assemblyId = await newAssembly();
    const a = await createTestSession(assemblyId);
    const b = await createTestSession(assemblyId);
    const c = await createTestSession(assemblyId);

    await setActive(assemblyId, b.id);

    const map = await activeMap([a.id, b.id, c.id]);
    expect(map.get(a.id)).toBe(false);
    expect(map.get(b.id)).toBe(true);
    expect(map.get(c.id)).toBe(false);
  });

  it("active を別のセッションに切り替えられる", async () => {
    const assemblyId = await newAssembly();
    const a = await createTestSession(assemblyId, { is_active: true });
    const b = await createTestSession(assemblyId);

    await setActive(assemblyId, b.id);

    const map = await activeMap([a.id, b.id]);
    expect(map.get(a.id)).toBe(false);
    expect(map.get(b.id)).toBe(true);
  });

  it("ほかの議会の会期は変わらない", async () => {
    const assemblyId = await newAssembly();
    const otherAssemblyId = await newAssembly();
    const target = await createTestSession(assemblyId);
    const other = await createTestSession(otherAssemblyId, {
      is_active: true,
    });

    await setActive(assemblyId, target.id);

    const map = await activeMap([target.id, other.id]);
    expect(map.get(target.id)).toBe(true);
    expect(map.get(other.id)).toBe(true);
  });

  it("存在しない UUID を指定すると、その議会の会期はすべて非 active になる", async () => {
    const assemblyId = await newAssembly();
    const a = await createTestSession(assemblyId, { is_active: true });

    await setActive(assemblyId, "00000000-0000-0000-0000-000000000000");

    expect((await activeMap([a.id])).get(a.id)).toBe(false);
  });
});
