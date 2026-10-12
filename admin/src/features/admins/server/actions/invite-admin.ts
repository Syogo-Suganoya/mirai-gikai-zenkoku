"use server";

import { generateInitialPassword } from "@mirai-gikai/shared/auth/initial-password";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/server/lib/session";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type {
  CreateAdminInput,
  IssuedPasswordResult,
} from "../../shared/types";
import { validateEmail } from "../../shared/utils/validate-email";
import {
  findUserIdByEmail,
  insertUser,
} from "../repositories/admin-repository";

/**
 * 管理者のアカウントを作り、初期パスワードを1度だけ返す（設計 v3 3.4.4節）。
 * メールは送らない。作った人が本人に渡し、本人は初回ログインで変更する。
 */
export async function createAdmin(
  input: CreateAdminInput
): Promise<IssuedPasswordResult> {
  try {
    await requireUser();

    const email = input.email.trim().toLowerCase();
    if (!email) {
      return { error: "メールアドレスを入力してください" };
    }
    const emailError = validateEmail(email);
    if (emailError) {
      return { error: emailError };
    }
    if (await findUserIdByEmail(email)) {
      return { error: "このメールアドレスは既に登録されています" };
    }

    const initialPassword = generateInitialPassword();
    await insertUser({ email, password: initialPassword });

    revalidatePath(routes.admins());
    return { success: true, email, initialPassword };
  } catch (error) {
    console.error("Create admin error:", error);
    return {
      error: getErrorMessage(error, "アカウントの作成中にエラーが発生しました"),
    };
  }
}
