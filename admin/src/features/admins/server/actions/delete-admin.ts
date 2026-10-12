"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { AdminIdInput } from "../../shared/types";
import { deleteUser } from "../repositories/admin-repository";

export async function deleteAdmin(input: AdminIdInput) {
  try {
    const currentAdmin = await requireUser();

    if (currentAdmin.id === input.id) {
      return { error: "自分自身を削除することはできません" };
    }

    await deleteUser(input.id);

    revalidatePath(routes.admins());
    return { success: true };
  } catch (error) {
    console.error("Delete admin error:", error);
    return {
      error: getErrorMessage(error, "アカウントの削除中にエラーが発生しました"),
    };
  }
}
