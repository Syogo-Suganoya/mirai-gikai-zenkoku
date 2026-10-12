import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAssembly } from "@/features/assemblies/server/loaders/get-assembly";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillDetailLayout } from "@/features/bills/server/components/bill-detail/bill-detail-layout";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { billDetailHref } from "@/features/bills/shared/utils/bill-href";
import { env } from "@/lib/env";

interface BillDetailPageProps {
  params: Promise<{
    assembly: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: BillDetailPageProps): Promise<Metadata> {
  const { assembly: assemblySlug, id } = await params;
  const assembly = await requireAssembly(assemblySlug);
  const bill = await getBillById(id, assembly.id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  // bill_contentのsummaryがあればそれを使用、なければデフォルト値を使用
  const description = bill.bill_content?.summary || "議案の詳細情報";
  const defaultOgpUrl = new URL("/ogp.jpg", env.webUrl).toString();

  // シェア用OGP画像（share_thumbnail_url > thumbnail_url > デフォルト）
  // ページ表示用のthumbnail_urlとは別に、SNSシェア用の画像を優先
  const shareImageUrl =
    bill.share_thumbnail_url || bill.thumbnail_url || defaultOgpUrl;

  return {
    title: bill.name,
    description: description,
    alternates: {
      canonical: billDetailHref(bill),
    },
    openGraph: {
      title: bill.name,
      description: description,
      type: "article",
      publishedTime: bill.submitted_date ?? undefined,
      modifiedTime: bill.updated_at,
      images: [
        {
          url: shareImageUrl,
          alt: `${bill.name} のOGPイメージ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: bill.name,
      description: description,
      images: [shareImageUrl],
    },
  };
}

export default async function BillDetailPage({ params }: BillDetailPageProps) {
  const { assembly: assemblySlug, id } = await params;
  const assembly = await requireAssembly(assemblySlug);
  const [billWithContent, currentDifficulty] = await Promise.all([
    getBillById(id, assembly.id),
    getDifficultyLevel(),
  ]);

  if (!billWithContent) {
    notFound();
  }

  return (
    <BillDetailLayout
      bill={billWithContent}
      assembly={assembly}
      currentDifficulty={currentDifficulty}
    />
  );
}
