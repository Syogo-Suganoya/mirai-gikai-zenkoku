import { describe, expect, it } from "vitest";
import type { SessionInput } from "../types";
import { validateSessionInput } from "./validate-session-input";

const valid: SessionInput = {
  session_key: "2026-09",
  name: "令和8年9月定例会",
  type: "regular",
  start_date: "2026-09-01",
  end_date: "2026-09-25",
  slug: null,
  source_url: null,
};

describe("validateSessionInput", () => {
  it("正しい入力なら null", () => {
    expect(validateSessionInput(valid)).toBeNull();
  });

  it("会期キーが空・使えない文字ならエラー", () => {
    expect(validateSessionInput({ ...valid, session_key: " " })).toContain(
      "会期キーを入力"
    );
    expect(
      validateSessionInput({ ...valid, session_key: "令和8年9月" })
    ).toContain("半角英数字");
  });

  it("会期名・日付が無ければエラー", () => {
    expect(validateSessionInput({ ...valid, name: "" })).toContain("会期名");
    expect(validateSessionInput({ ...valid, start_date: "" })).toContain(
      "開会日"
    );
    expect(validateSessionInput({ ...valid, end_date: "" })).toContain(
      "閉会日"
    );
  });

  it("閉会日が開会日より前ならエラー", () => {
    expect(
      validateSessionInput({ ...valid, end_date: "2026-08-01" })
    ).not.toBeNull();
  });

  it("スラッグに使えない文字があればエラー", () => {
    expect(validateSessionInput({ ...valid, slug: "Sept" })).not.toBeNull();
  });
});
