import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import type { CurrentUser } from "@/features/auth/server/lib/session";
import type { AssemblyListItem } from "../../shared/types";
import { findAssembliesWithBillCounts } from "../repositories/assembly-repository";

/** ログイン中のユーザーが扱える議会（全体管理者はすべて、ほかは担当の議会だけ） */
export async function loadAssemblies(
  user: CurrentUser
): Promise<AssemblyListItem[]> {
  noStore();
  return findAssembliesWithBillCounts(
    user.is_super_admin ? undefined : user.id
  );
}
