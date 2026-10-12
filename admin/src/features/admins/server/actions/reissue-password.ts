"use server";

import { generateInitialPassword } from "@mirai-gikai/shared/auth/initial-password";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { AdminIdInput, IssuedPasswordResult } from "../../shared/types";
import {
  findAdminUsers,
  resetUserPassword,
} from "../repositories/admin-repository";

/** パスワードを忘れたときに、ほかの管理者が初期パスワードを発行し直す */
export async function reissuePassword(
  input: AdminIdInput
): Promise<IssuedPasswordResult> {
  try {
    const currentAdmin = await requireUser();
    if (currentAdmin.id === input.id) {
      return {
        error: "自分のパスワードは「パスワードの変更」から変更してください",
      };
    }
    const target = (await findAdminUsers()).find((u) => u.id === input.id);
    if (!target) return { error: "アカウントが見つかりません" };

    const initialPassword = generateInitialPassword();
    await resetUserPassword(target.id, initialPassword);

    revalidatePath(routes.admins());
    return { success: true, email: target.email, initialPassword };
  } catch (error) {
    console.error("Reissue password error:", error);
    return {
      error: getErrorMessage(
        error,
        "パスワードの再発行中にエラーが発生しました"
      ),
    };
  }
}
