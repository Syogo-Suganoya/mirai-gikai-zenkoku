import "server-only";

import { toAssemblyKind } from "@mirai-gikai/shared/assemblies/assembly-kind";
import type { AssemblyKindBySlug } from "../../shared/utils/active-assembly-kind";
import { findAssemblySlugTypes } from "../repositories/assembly-repository";

/** 議会のスラッグ → 区分（ヘッダーで、議会の画面でも区分を選択中にする） */
export async function loadAssemblyKindBySlug(): Promise<AssemblyKindBySlug> {
  const rows = await findAssemblySlugTypes();
  return Object.fromEntries(
    rows.map((row) => [row.slug, toAssemblyKind(row.type)])
  );
}
