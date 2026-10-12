import type { BillStatusEnum } from "../types";

/** 地方議会の審議の流れ（提出 → 委員会で審査 → 本会議で議決） */
export const BILL_PROGRESS_STEPS = [
  { label: "議案\n提出" },
  { label: "委員会\n審査" },
  { label: "本会議\n議決" },
] as const;

// ステップ番号マッピング
const STATUS_TO_STEP: Record<BillStatusEnum, number> = {
  preparing: 0,
  introduced: 1,
  referred_to_committee: 2,
  decided: 3,
  continued: 2,
  withdrawn: 3,
} as const;

// プログレス比率（ドットは均等に並ぶので、中点同士をつなぐ）
const PROGRESS_RATIOS = [0, 1 / 6, 1 / 2, 1] as const;

/**
 * ステータスとステータスノートからメッセージを生成する
 */
export function getStatusMessage(
  status: BillStatusEnum,
  statusNote: string | null | undefined
): string {
  if (status === "preparing") return "議案提出前";
  if (statusNote) return statusNote;
  if (status === "continued") return "継続審査になりました";
  if (status === "withdrawn") return "撤回されました";
  return "";
}

/**
 * ステップ番号と現在のステップからステップの状態を判定する
 */
export function getStepState(
  stepNumber: number,
  currentStep: number,
  isPreparing: boolean
): "active" | "inactive" {
  if (isPreparing) return "inactive";
  return stepNumber <= currentStep ? "active" : "inactive";
}

/**
 * 現在のステップからプログレスバーの幅(%)を計算する
 */
export function calculateProgressWidth(currentStep: number): number {
  const ratio = PROGRESS_RATIOS[currentStep] ?? 0;
  return ratio * 100;
}

/**
 * ステータスからステップ番号を取得する
 */
export function getCurrentStep(status: BillStatusEnum): number {
  return STATUS_TO_STEP[status] ?? 0;
}
