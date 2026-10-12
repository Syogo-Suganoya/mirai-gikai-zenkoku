import { describe, expect, it } from "vitest";
import { toBillColumns } from "./to-bill-columns";

describe("toBillColumns", () => {
  it("表示用タイトルが空なら正式名称を使う", () => {
    expect(
      toBillColumns({ name: " ", official_name: "手数料条例の一部改正" }).name
    ).toBe("手数料条例の一部改正");
  });

  it("表示用タイトルがあればそれを使う", () => {
    expect(
      toBillColumns({ name: "手数料の見直し", official_name: "正式" }).name
    ).toBe("手数料の見直し");
  });

  it("提出日の空文字は null、日付はそのまま", () => {
    expect(toBillColumns({ submitted_date: "" }).submitted_date).toBeNull();
    expect(toBillColumns({ submitted_date: "2026-09-01" }).submitted_date).toBe(
      "2026-09-01"
    );
  });

  it("undefined の項目は含めない（部分更新）", () => {
    const result = toBillColumns({ status: "decided" });
    expect(result).toEqual({ status: "decided" });
  });
});
