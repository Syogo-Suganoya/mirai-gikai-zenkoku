import "server-only";

import { notFound } from "next/navigation";
import { getAssemblyBySlug } from "@/features/assemblies/server/loaders/get-assembly";
import type { AssemblyWithSettings } from "@/features/assemblies/shared/types";
import type { BillWithContent } from "../../shared/types";
import { getBillById } from "./get-bill-by-id";
import { getBillByIdAdmin } from "./get-bill-by-id-admin";
import { validatePreviewToken } from "./validate-preview-token";

export type AssemblyBill = {
  assembly: AssemblyWithSettings;
  bill: BillWithContent;
};

/** URL の議会スラッグと議案のキー（slug か id）から、公開中の議案を取得する */
export async function getAssemblyBill(
  assemblySlug: string,
  billKey: string
): Promise<AssemblyBill | null> {
  const assembly = await getAssemblyBySlug(assemblySlug);
  if (!assembly) return null;
  const bill = await getBillById(billKey, assembly.id);
  return bill ? { assembly, bill } : null;
}

/** getAssemblyBill のページ用。なければ 404 にする */
export async function requireAssemblyBill(
  assemblySlug: string,
  billKey: string
): Promise<AssemblyBill> {
  const result = await getAssemblyBill(assemblySlug, billKey);
  if (!result) notFound();
  return result;
}

/**
 * プレビュー用。非公開の議案も取得し、トークンを確かめる。
 * トークンが正しくないとき・議案がないときは 404 にする。
 */
export async function requirePreviewBill(
  assemblySlug: string,
  billKey: string,
  token: string | undefined
): Promise<AssemblyBill> {
  const assembly = await getAssemblyBySlug(assemblySlug);
  if (!assembly) notFound();
  const bill = await getBillByIdAdmin(billKey, assembly.id);
  if (!bill || !(await validatePreviewToken(bill.id, token))) notFound();
  return { assembly, bill };
}
