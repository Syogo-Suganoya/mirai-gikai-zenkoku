import "server-only";

import { notFound } from "next/navigation";
import {
  type AssemblyBill,
  requireAssemblyBill,
} from "@/features/bills/server/loaders/get-assembly-bill";
import { isInterviewEnabled } from "../../shared/utils/is-interview-enabled";

/**
 * インタビュー・意見・トピックのページ用に議案を取得する。
 * 議案がないとき、議会の設定でインタビューを出していないとき、ダミーの議案のときは 404 にする。
 */
export async function requireInterviewBill(
  assemblySlug: string,
  billKey: string
): Promise<AssemblyBill> {
  const result = await requireAssemblyBill(assemblySlug, billKey);
  if (!isInterviewEnabled(result.assembly.settings, result.bill)) {
    notFound();
  }
  return result;
}
