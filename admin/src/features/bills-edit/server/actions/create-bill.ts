"use server";

import { DummyDataExistsError } from "@mirai-gikai/shared/csv-import/dummy-handling";
import { toFurigana } from "@mirai-gikai/shared/furigana/generate";
import { redirect } from "next/navigation";
import { requireAssemblyAction } from "@/features/assemblies/server/loaders/require-assembly";
import { routes } from "@/lib/routes";
import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { type BillCreateInput, billCreateSchema } from "../../shared/types";
import { toBillColumns } from "../../shared/utils/to-bill-columns";
import { createBillRecord } from "../repositories/bill-edit-repository";

export type CreateBillResult =
  | { error: string }
  /** 議会にダミーデータが残っている。消してよいか確認してから deleteDummyData: true で送り直す */
  | { needsDummyDeletion: true };

/**
 * 議案を作る（編集者以上）。公開状態は下書きで作り、公開は議案一覧から行う。
 */
export async function createBill(
  assemblySlug: string,
  input: BillCreateInput,
  options: { deleteDummyData?: boolean } = {}
): Promise<CreateBillResult> {
  try {
    const { assembly } = await requireAssemblyAction(assemblySlug, "editor");
    const validated = billCreateSchema.parse(input);
    const columns = toBillColumns(validated);
    const name = columns.name ?? validated.official_name;

    await createBillRecord(
      {
        ...columns,
        assembly_id: assembly.id,
        session_id: validated.session_id,
        bill_number: validated.bill_number,
        official_name: validated.official_name,
        category: validated.category,
        name,
        name_furigana: await toFurigana(name),
        publish_status: "draft",
      },
      { deleteDummyData: options.deleteDummyData }
    );

    await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
  } catch (error) {
    if (error instanceof DummyDataExistsError) {
      return { needsDummyDeletion: true };
    }
    console.error("Create bill error:", error);
    return {
      error: getErrorMessage(error, "議案の作成中にエラーが発生しました"),
    };
  }

  // 成功したら議会の議案一覧へ
  redirect(routes.assemblyBills(assemblySlug));
}
