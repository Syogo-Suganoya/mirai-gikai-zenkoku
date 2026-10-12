import { AnalysisViewerPage } from "@/features/analysis-viewer/server/components/analysis-viewer-page";
import { requireSuperAdminPage } from "@/features/auth/server/lib/auth-server";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    audience?: string | string[];
    view?: string | string[];
    q?: string | string[];
  }>;
}) {
  // インタビュー・分析は全体管理者だけ（議会の担当者にはまだ開放していない）
  await requireSuperAdminPage();
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  return <AnalysisViewerPage billId={id} searchParams={resolvedSearchParams} />;
}
