import { describe, expect, it } from "vitest";
import { signVisitorId, verifyVisitorToken } from "./visitor-token";

const ID = "3f1c2a4e-5b6d-4e8f-9a0b-1c2d3e4f5a6b";
const SECRET = "test-secret";

describe("verifyVisitorToken", () => {
  it("署名した匿名 ID はそのまま取り出せる", async () => {
    const token = await signVisitorId(ID, SECRET);
    expect(await verifyVisitorToken(token, SECRET)).toBe(ID);
  });

  it("別の鍵で署名したものは受け付けない", async () => {
    const token = await signVisitorId(ID, "other-secret");
    expect(await verifyVisitorToken(token, SECRET)).toBeNull();
  });

  it("ID を書き換えたものは受け付けない", async () => {
    const token = await signVisitorId(ID, SECRET);
    const tampered = token.replace(ID, "00000000-0000-4000-8000-000000000000");
    expect(await verifyVisitorToken(tampered, SECRET)).toBeNull();
  });

  it("形式が違うものは受け付けない", async () => {
    expect(await verifyVisitorToken(undefined, SECRET)).toBeNull();
    expect(await verifyVisitorToken("", SECRET)).toBeNull();
    expect(await verifyVisitorToken("abc", SECRET)).toBeNull();
    expect(await verifyVisitorToken("not-a-uuid.sig", SECRET)).toBeNull();
  });
});
