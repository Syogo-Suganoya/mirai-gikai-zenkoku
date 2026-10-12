import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBillPage } from "@/features/bills/server/loaders/require-bill-access";
import { BillEditForm } from "@/features/bills-edit/client/components/bill-edit-form";
import { BillTagsForm } from "@/features/bills-edit/client/components/bill-tags-form";
import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { getBillTagIds } from "@/features/bills-edit/server/loaders/get-bill-tag-ids";
import { StanceForm } from "@/features/mirai-stance/client/components/stance-form";
import { getStanceByBillId } from "@/features/mirai-stance/server/loaders/get-stance-by-bill-id";
import { loadSessions } from "@/features/sessions/server/loaders/load-sessions";
import { loadTags } from "@/features/tags/server/loaders/load-tags";
import { routes } from "@/lib/routes";

interface BillEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BillEditPage({ params }: BillEditPageProps) {
  const { id } = await params;
  const { assembly, settings } = await requireBillPage(id);
  const [bill, stance, allTags, selectedTagIds, sessions] = await Promise.all([
    getBillById(id),
    getStanceByBillId(id),
    loadTags(),
    getBillTagIds(id),
    loadSessions(assembly.id),
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.assemblyBills(assembly.slug) as Route}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          議案一覧に戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">議案編集</h1>
        <p className="text-gray-600 mt-1">議案の基本情報を編集します</p>
      </div>

      <div className="space-y-6">
        <BillEditForm
          assemblySlug={assembly.slug}
          bill={bill}
          sessions={sessions}
        />
        {/* チームみらいのスタンスは、議員がいる議会で設定したときだけ（設計 v3 3.2節） */}
        {settings.show_mirai_stance && (
          <StanceForm
            billId={bill.id}
            stance={stance}
            billStatus={bill.status}
          />
        )}
        <BillTagsForm
          billId={bill.id}
          allTags={allTags}
          selectedTagIds={selectedTagIds}
        />
      </div>
    </div>
  );
}
