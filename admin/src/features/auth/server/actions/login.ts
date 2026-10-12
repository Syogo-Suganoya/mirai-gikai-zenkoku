"use server";

import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";
import { loginSchema } from "../../shared/types";
import { startSession } from "../lib/session";
import {
  findUserByCredentials,
  touchLastLogin,
} from "../repositories/auth-repository";

export type LoginState = { error: string | null };

const INVALID = "メールアドレスかパスワードが違います";

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? INVALID };
  }
  const { email, password } = parsed.data;

  const user = await findUserByCredentials(email, password);
  if (!user) return { error: INVALID };

  await startSession(user.id);
  await touchLastLogin(user.id);

  redirect(
    user.must_change_password ? routes.accountPassword() : routes.home()
  );
}
