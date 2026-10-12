"use server";

import { isUniqueViolation } from "@mirai-gikai/db";
import { generateInitialPassword } from "@mirai-gikai/shared/auth/initial-password";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import type { AssemblyMemberInput } from "../../shared/types";
import {
  normalizeMemberInput,
  validateMemberInput,
} from "../../shared/utils/validate-member-input";
import { requireAssemblyAction } from "../loaders/require-assembly";
import {
  deleteMember,
  findUserForMember,
  insertMember,
  updateMember,
} from "../repositories/assembly-member-repository";

type ActionResult = { success: true } | { error: string };
/** 新しいアカウントを作ったときだけ初期パスワードを返す（このとき1度だけ画面に出す） */
type AddResult =
  | {
      success: true;
      issued: { email: string; initialPassword: string } | null;
    }
  | { error: string };

/**
 * 議会に担当者（確認者・編集者）を追加する（全体管理者だけ。設計 v3 3.4.4節）。
 * アカウントが無ければ作って初期パスワードを発行する。あればこの議会の担当に加えるだけ。
 */
export async function addAssemblyMember(
  assemblySlug: string,
  rawInput: AssemblyMemberInput
): Promise<AddResult> {
  try {
    const { assembly, user } = await requireAssemblyAction(
      assemblySlug,
      "super_admin"
    );
    const input = normalizeMemberInput(rawInput);
    const error = validateMemberInput(input);
    if (error) return { error };

    const existing = await findUserForMember(input.email);
    if (existing?.is_super_admin) {
      return {
        error:
          "全体管理者はすべての議会を扱えるので、担当に加える必要はありません",
      };
    }

    const { email, ...values } = input;
    const initialPassword = existing ? null : generateInitialPassword();
    await insertMember({
      assemblyId: assembly.id,
      invitedBy: user.id,
      values,
      user: existing ?? { email, initialPassword: initialPassword ?? "" },
    });

    revalidatePath(routes.assemblyMembers(assemblySlug));
    return {
      success: true,
      issued: initialPassword ? { email, initialPassword } : null,
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "この人は既にこの議会の担当者です" };
    }
    console.error("Add assembly member error:", error);
    return {
      error: getErrorMessage(error, "担当者の追加中にエラーが発生しました"),
    };
  }
}

/** 役割・表示名・所属を変える（全体管理者だけ） */
export async function editAssemblyMember(
  assemblySlug: string,
  userId: string,
  rawInput: AssemblyMemberInput
): Promise<ActionResult> {
  try {
    const { assembly } = await requireAssemblyAction(
      assemblySlug,
      "super_admin"
    );
    const input = normalizeMemberInput(rawInput);
    const error = validateMemberInput(input);
    if (error) return { error };

    const { email: _, ...values } = input;
    if (!(await updateMember(assembly.id, userId, values))) {
      return { error: "担当者が見つかりません" };
    }
    revalidatePath(routes.assemblyMembers(assemblySlug));
    return { success: true };
  } catch (error) {
    console.error("Edit assembly member error:", error);
    return {
      error: getErrorMessage(error, "担当者の変更中にエラーが発生しました"),
    };
  }
}

/** 議会の担当から外す（アカウントは残る。削除は「担当者」画面から） */
export async function removeAssemblyMember(
  assemblySlug: string,
  userId: string
): Promise<ActionResult> {
  try {
    const { assembly } = await requireAssemblyAction(
      assemblySlug,
      "super_admin"
    );
    await deleteMember(assembly.id, userId);
    revalidatePath(routes.assemblyMembers(assemblySlug));
    return { success: true };
  } catch (error) {
    console.error("Remove assembly member error:", error);
    return {
      error: getErrorMessage(error, "担当から外す処理でエラーが発生しました"),
    };
  }
}
