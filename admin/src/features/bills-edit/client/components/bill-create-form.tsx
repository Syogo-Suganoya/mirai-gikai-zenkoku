"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { DummyDeletionDialog } from "@/features/assemblies/client/components/dummy-deletion-dialog";
import type { Session } from "@/features/sessions/shared/types";
import { createBill } from "../../server/actions/create-bill";
import {
  type BillCreateInput,
  type BillFormValues,
  billCreateSchema,
} from "../../shared/types";
import { useBillForm } from "../hooks/use-bill-form";
import { BillFormFields } from "./bill-form-fields";

interface BillCreateFormProps {
  assemblySlug: string;
  assemblyName: string;
  sessions: Session[];
  defaultPublishLevel: BillCreateInput["publish_level"];
}

export function BillCreateForm({
  assemblySlug,
  assemblyName,
  sessions,
  defaultPublishLevel,
}: BillCreateFormProps) {
  const { isSubmitting, error, handleSubmit, handleCancel } =
    useBillForm(assemblySlug);
  // 議会にダミーが残っていたときに、削除の確認を出すために入力を取っておく
  const [pending, setPending] = useState<BillCreateInput | null>(null);

  const form = useForm<BillFormValues, unknown, BillCreateInput>({
    resolver: zodResolver(billCreateSchema),
    defaultValues: {
      // 会期は新しい順に並んでいるので、最新の会期を初期値にする
      session_id: sessions[0]?.id ?? "",
      bill_number: "",
      official_name: "",
      name: "",
      category: "ordinance",
      submitter: "",
      submitted_date: "",
      committee_name: "",
      status: "introduced",
      status_note: null,
      source_url: null,
      materials_url: null,
      source_pages: null,
      publish_level: defaultPublishLevel,
      thumbnail_url: null,
      share_thumbnail_url: null,
      slug: null,
      is_featured: false,
      is_review_completed: false,
      knowledge_source: "",
      use_knowledge_source_in_chat: false,
    },
  });

  const submit = (data: BillCreateInput, deleteDummyData: boolean) =>
    handleSubmit(async () => {
      const result = await createBill(assemblySlug, data, { deleteDummyData });
      if ("needsDummyDeletion" in result) {
        setPending(data);
        return false;
      }
      throw new Error(result.error);
    }, "作成中にエラーが発生しました");

  return (
    <Card>
      <CardHeader>
        <CardTitle>議案新規作成（{assemblyName}）</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => submit(data, false))}
            className="space-y-6"
          >
            <BillFormFields control={form.control} sessions={sessions} />

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "作成"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <DummyDeletionDialog
        open={pending !== null}
        assemblyName={assemblyName}
        actionLabel="この議案を登録します"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const data = pending;
          setPending(null);
          if (data) submit(data, true);
        }}
      />
    </Card>
  );
}
