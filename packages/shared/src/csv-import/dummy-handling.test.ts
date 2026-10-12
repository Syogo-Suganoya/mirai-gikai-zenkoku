import { describe, expect, it } from "vitest";
import { decideDummyHandling } from "./dummy-handling";

describe("decideDummyHandling", () => {
  it("ダミーがなければそのまま取り込む", () => {
    expect(decideDummyHandling(false, false)).toBe("none");
    expect(decideDummyHandling(false, true)).toBe("none");
  });

  it("ダミーがあり削除に同意していれば消してから取り込む", () => {
    expect(decideDummyHandling(true, true)).toBe("delete");
  });

  it("ダミーがあり同意がなければ取り込まない", () => {
    expect(decideDummyHandling(true, false)).toBe("reject");
  });
});
