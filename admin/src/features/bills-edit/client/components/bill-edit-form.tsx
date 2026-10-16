"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import type { Session } from "@/features/sessions/shared/types";
import { updateBill } from "../../server/actions/update-bill";
import {
  type Bill,
  type BillFormValues,
  type BillUpdateInput,
  billUpdateSchema,
} from "../../shared/types";
import { useBillForm } from "../hooks/use-bill-form";
import { BillFormFields } from "./bill-form-fields";

interface BillEditFormProps {
  assemblySlug: string;
  bill: Bill;
  sessions: Session[];
}

export function BillEditForm({
  assemblySlug,
  bill,
  sessions,
}: BillEditFormProps) {
  const { isSubmitting, error, handleSubmit, handleCancel } =
    useBillForm(assemblySlug);

  const form = useForm<BillFormValues, unknown, BillUpdateInput>({
    resolver: zodResolver(billUpdateSchema),
    defaultValues: {
      session_id: bill.session_id,
      bill_number: bill.bill_number,
      official_name: bill.official_name,
      name: bill.name,
      category: bill.category,
      submitter: bill.submitter ?? "",
      submitted_date: bill.submitted_date ?? "",
      committee_name: bill.committee_name ?? "",
      status: bill.status,
      status_note: bill.status_note,
      source_url: bill.source_url,
      materials_url: bill.materials_url,
      source_needs_update: bill.source_needs_update,
      source_pages: bill.source_pages,
      publish_level: bill.publish_level,
      thumbnail_url: bill.thumbnail_url,
      share_thumbnail_url: bill.share_thumbnail_url,
      slug: bill.slug,
      is_featured: bill.is_featured,
      is_review_completed: bill.is_review_completed,
      knowledge_source: bill.knowledge_source ?? "",
      use_knowledge_source_in_chat: bill.use_knowledge_source_in_chat,
    },
  });

  const onSubmit = (data: BillUpdateInput) => {
    handleSubmit(
      () => updateBill(bill.id, data),
      "更新中にエラーが発生しました"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>議案基本情報編集</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BillFormFields
              control={form.control}
              billId={bill.id}
              sessions={sessions}
            />

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
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
    </Card>
  );
}
