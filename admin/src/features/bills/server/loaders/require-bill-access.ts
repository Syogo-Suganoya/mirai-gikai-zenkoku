import "server-only";

import { notFound } from "next/navigation";
import {
  requireAssemblyAction,
  requireAssemblyPage,
} from "@/features/assemblies/server/loaders/require-assembly";
import { findBillAssembly } from "../repositories/bill-repository";

/**
 * 議案のページ（/bills/[id]/...）の先頭で呼ぶ。議案が無ければ 404。
 * 議案の議会（slug・名前）を返すので、議会の一覧に戻るリンクに使う。
 */
export async function requireBillPage(billId: string) {
  const billAssembly = await findBillAssembly(billId).catch(() => null);
  if (!billAssembly) notFound();
  const context = await requireAssemblyPage(billAssembly.slug);
  return { ...context, billSlug: billAssembly.bill_slug };
}

/** 議案を操作する Server Action 用。ログインしていなければ・議案が無ければエラーを投げる */
export async function requireBillAction(billId: string) {
  const billAssembly = await findBillAssembly(billId);
  if (!billAssembly) throw new Error("議案が見つかりません");
  return requireAssemblyAction(billAssembly.slug);
}
