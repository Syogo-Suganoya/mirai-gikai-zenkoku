import "server-only";

import { notFound } from "next/navigation";
import {
  requireAssemblyAction,
  requireAssemblyPage,
} from "@/features/assemblies/server/loaders/require-assembly";
import type { AssemblyAccessRole } from "@/features/assemblies/shared/types";
import { findBillAssembly } from "../repositories/bill-repository";

/**
 * 議案のページ（/bills/[id]/...）の先頭で呼ぶ。議案の議会を担当していなければ 404。
 * 議案の議会（slug・名前）を返すので、議会の一覧に戻るリンクに使う。
 */
export async function requireBillPage(
  billId: string,
  required: AssemblyAccessRole = "editor"
) {
  const billAssembly = await findBillAssembly(billId).catch(() => null);
  if (!billAssembly) notFound();
  const context = await requireAssemblyPage(billAssembly.slug, required);
  return { ...context, billSlug: billAssembly.bill_slug };
}

/** 議案を操作する Server Action 用。権限が足りなければエラーを投げる */
export async function requireBillAction(
  billId: string,
  required: AssemblyAccessRole = "editor"
) {
  const billAssembly = await findBillAssembly(billId);
  if (!billAssembly) throw new Error("議案が見つかりません");
  return requireAssemblyAction(billAssembly.slug, required);
}
