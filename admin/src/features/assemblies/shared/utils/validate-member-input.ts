import { validateEmail } from "@/features/admins/shared/utils/validate-email";
import { ASSEMBLY_MEMBER_ROLE_LABELS } from "../constants/labels";
import type { AssemblyMemberInput } from "../types";

const MAX_NAME_LENGTH = 100;

/** 前後の空白を除き、メールアドレスは小文字にそろえる */
export function normalizeMemberInput(
  input: AssemblyMemberInput
): AssemblyMemberInput {
  return {
    email: input.email.trim().toLowerCase(),
    role: input.role,
    display_name: input.display_name.trim(),
    affiliation: input.affiliation.trim(),
  };
}

/**
 * 担当者の入力を確かめる。問題が無ければ null。
 * 表示名と所属は公開ページに出す（設計 v2 2.3節・2.8節）ので必須。
 */
export function validateMemberInput(input: AssemblyMemberInput): string | null {
  if (!input.email) return "メールアドレスを入力してください";
  const emailError = validateEmail(input.email);
  if (emailError) return emailError;
  if (!(input.role in ASSEMBLY_MEMBER_ROLE_LABELS)) {
    return "役割を選んでください";
  }
  if (!input.display_name) return "表示名を入力してください";
  if (!input.affiliation) return "所属を入力してください";
  if (
    input.display_name.length > MAX_NAME_LENGTH ||
    input.affiliation.length > MAX_NAME_LENGTH
  ) {
    return `表示名と所属は${MAX_NAME_LENGTH}文字以内にしてください`;
  }
  return null;
}
