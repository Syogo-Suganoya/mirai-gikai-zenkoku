import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDetailLayout } from "@/features/bills/server/components/bill-detail/bill-detail-layout";
import { PreviewBanner } from "@/features/bills/server/components/preview-banner";
import { requirePreviewBill } from "@/features/bills/server/loaders/get-assembly-bill";

interface PreviewBillPageProps {
  params: Promise<{ assembly: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function PreviewBillPage({
  params,
  searchParams,
}: PreviewBillPageProps) {
  const [{ assembly: assemblySlug, id }, { token }] = await Promise.all([
    params,
    searchParams,
  ]);
  // 管理者用の取得（非公開議案も対象）。トークンが正しくなければ 404
  const [{ assembly, bill }, difficulty] = await Promise.all([
    requirePreviewBill(assemblySlug, id, token),
    getDifficultyLevel(),
  ]);

  return (
    <>
      <PreviewBanner
        assemblySlug={assembly.slug}
        message="この議案は一般公開されていません"
      />
      <BillDetailLayout
        bill={bill}
        assembly={assembly}
        currentDifficulty={difficulty}
      />
    </>
  );
}
