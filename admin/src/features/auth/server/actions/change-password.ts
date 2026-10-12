"use server";

import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { validateNewPassword } from "../../shared/utils/password-policy";
import { requireUser, startSession } from "../lib/session";
import {
  deleteSessionsByUserId,
  updateUserPassword,
  verifyUserPassword,
} from "../repositories/auth-repository";

export type ChangePasswordState = { error: string | null };

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await requireUser();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!(await verifyUserPassword(user.id, current))) {
    return { error: "今のパスワードが違います" };
  }
  const error = validateNewPassword(next, confirmation);
  if (error) return { error };

  await updateUserPassword(user.id, next);
  // ほかの端末のセッションも無効にし、この端末は新しいセッションに入れ直す
  await deleteSessionsByUserId(user.id);
  await startSession(user.id);

  redirect(routes.home());
}
