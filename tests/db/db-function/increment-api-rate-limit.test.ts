import { eq, like, sql } from "@mirai-gikai/db/orm";
import { api_rate_limits } from "@mirai-gikai/db/schema";
import { afterEach, describe, expect, it } from "vitest";
import { db, scalar } from "../utils";

const TEST_KEY_PREFIX = `test-rate-limit-${Date.now()}`;

function increment(key: string, windowStart: string, limit: number) {
  return scalar<boolean>(
    sql`increment_api_rate_limit(${key}, ${windowStart}::timestamptz, ${limit}::int)`
  );
}

function rowsOfKey(key: string) {
  return db
    .select({ window_start: api_rate_limits.window_start })
    .from(api_rate_limits)
    .where(eq(api_rate_limits.key, key));
}

describe("increment_api_rate_limit", () => {
  afterEach(async () => {
    await db
      .delete(api_rate_limits)
      .where(like(api_rate_limits.key, `${TEST_KEY_PREFIX}%`));
  });

  it("制限内は true、超過すると false を返す", async () => {
    const key = `${TEST_KEY_PREFIX}-basic`;
    const windowStart = "2026-07-14T12:00:00.000Z";

    expect(await increment(key, windowStart, 3)).toBe(true);
    expect(await increment(key, windowStart, 3)).toBe(true);
    expect(await increment(key, windowStart, 3)).toBe(true);
    expect(await increment(key, windowStart, 3)).toBe(false);
  });

  it("ウィンドウが変わるとカウントがリセットされ、過去ウィンドウの行は掃除される", async () => {
    const key = `${TEST_KEY_PREFIX}-window`;
    const window1 = "2026-07-14T12:00:00.000Z";
    const window2 = "2026-07-14T12:01:00.000Z";

    expect(await increment(key, window1, 1)).toBe(true);
    expect(await increment(key, window1, 1)).toBe(false);

    // 新しいウィンドウではリセットされて許可される
    expect(await increment(key, window2, 1)).toBe(true);

    // 過去ウィンドウの行は削除されている
    const data = await rowsOfKey(key);
    expect(data).toHaveLength(1);
    expect(new Date(data[0]?.window_start ?? "").toISOString()).toBe(window2);
  });

  it("1時間より古い他キーの行も、新規ウィンドウ作成時に掃除される", async () => {
    const staleKey = `${TEST_KEY_PREFIX}-stale`;
    const activeKey = `${TEST_KEY_PREFIX}-active`;

    await increment(staleKey, "2026-07-14T10:00:00.000Z", 5);
    // 12:00 の新規ウィンドウ作成時に、11:00 より古い全キーの行が掃除される
    await increment(activeKey, "2026-07-14T12:00:00.000Z", 5);

    expect(await rowsOfKey(staleKey)).toHaveLength(0);
  });

  it("キーが異なればカウントは独立している", async () => {
    const windowStart = "2026-07-14T12:00:00.000Z";

    expect(await increment(`${TEST_KEY_PREFIX}-a`, windowStart, 1)).toBe(true);
    expect(await increment(`${TEST_KEY_PREFIX}-a`, windowStart, 1)).toBe(false);
    expect(await increment(`${TEST_KEY_PREFIX}-b`, windowStart, 1)).toBe(true);
  });
});
