import { describe, expect, it } from "vitest";
import { isLocalDatabaseUrl } from "./database-url";

describe("isLocalDatabaseUrl", () => {
  it("ローカルの接続先だけ true", () => {
    expect(isLocalDatabaseUrl("postgres://u:p@localhost:54322/db")).toBe(true);
    expect(isLocalDatabaseUrl("postgres://u:p@127.0.0.1:5432/db")).toBe(true);
    expect(isLocalDatabaseUrl("postgres://u:p@[::1]:5432/db")).toBe(true);
    expect(
      isLocalDatabaseUrl("postgres://u:p@ep-x-pooler.ap-southeast-1.aws.neon.tech/db")
    ).toBe(false);
    expect(isLocalDatabaseUrl("postgres://u:p@127.0.0.1.example.com/db")).toBe(false);
    expect(isLocalDatabaseUrl(undefined)).toBe(false);
    expect(isLocalDatabaseUrl("not a url")).toBe(false);
  });
});
