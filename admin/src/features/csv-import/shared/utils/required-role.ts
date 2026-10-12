import type { AssemblyMemberRole } from "@/features/assemblies/shared/types";
import type { AssemblyCsvKind } from "../types";

/**
 * 種類ごとに取り込める役割（設計 v3 6.2.1節）。
 * 議案は編集者も入れられる（公開は確認者が行う）。会派・会期・議決結果は確認者以上。
 */
export function requiredRoleForCsvKind(
  kind: AssemblyCsvKind
): AssemblyMemberRole {
  return kind === "bills" ? "editor" : "reviewer";
}
