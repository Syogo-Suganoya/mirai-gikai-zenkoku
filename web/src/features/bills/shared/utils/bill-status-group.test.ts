import { describe, expect, it } from "vitest";
import type { BillResultEnum, BillStatusEnum } from "../types";
import {
  countByStatusGroup,
  filterByStatusGroup,
  isBillStatusGroup,
  toBillStatusGroup,
} from "./bill-status-group";

const bill = (status: BillStatusEnum, result?: BillResultEnum) => ({
  status,
  bill_result: result ? { result } : undefined,
});

describe("toBillStatusGroup", () => {
  it("提出・委員会付託・準備中は「審議中」", () => {
    expect(toBillStatusGroup(bill("introduced"))).toBe("deliberating");
    expect(toBillStatusGroup(bill("referred_to_committee"))).toBe(
      "deliberating"
    );
    expect(toBillStatusGroup(bill("preparing"))).toBe("deliberating");
  });

  it("議決済みは結果で可決・否決に分ける", () => {
    expect(toBillStatusGroup(bill("decided", "passed"))).toBe("passed");
    expect(toBillStatusGroup(bill("decided", "amended"))).toBe("passed");
    expect(toBillStatusGroup(bill("decided", "adopted"))).toBe("passed");
    expect(toBillStatusGroup(bill("decided", "rejected"))).toBe("rejected");
    expect(toBillStatusGroup(bill("decided", "not_adopted"))).toBe("rejected");
  });

  it("継続審査と撤回はまとめる", () => {
    expect(toBillStatusGroup(bill("continued"))).toBe("continued");
    expect(toBillStatusGroup(bill("withdrawn"))).toBe("continued");
  });
});

describe("isBillStatusGroup", () => {
  it("定義済みの値だけ受け付ける", () => {
    expect(isBillStatusGroup("passed")).toBe(true);
    expect(isBillStatusGroup("enacted")).toBe(false);
    expect(isBillStatusGroup(undefined)).toBe(false);
  });
});

describe("countByStatusGroup / filterByStatusGroup", () => {
  const bills = [
    bill("introduced"),
    bill("decided", "passed"),
    bill("decided", "rejected"),
    bill("continued"),
  ];

  it("グループごとに数える", () => {
    expect(countByStatusGroup(bills)).toEqual({
      all: 4,
      deliberating: 1,
      passed: 1,
      rejected: 1,
      continued: 1,
    });
  });

  it("グループで絞る", () => {
    expect(filterByStatusGroup(bills, "all")).toHaveLength(4);
    expect(filterByStatusGroup(bills, "passed")).toEqual([bills[1]]);
  });
});
