import type { BillCreateInput } from "../types";

/**
 * フォームの入力を bills の列にする。
 * 表示用タイトルが空なら正式名称を使い、提出日は空なら null にする。
 */
export function toBillColumns(input: Partial<BillCreateInput>) {
  const { submitted_date, name, official_name, ...rest } = input;
  const definedFields = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined)
  );
  return {
    ...definedFields,
    ...(official_name !== undefined && { official_name }),
    ...(name !== undefined && {
      name: name.trim() || official_name || "",
    }),
    ...(submitted_date !== undefined && {
      submitted_date: submitted_date || null,
    }),
  };
}
