import type { Metadata } from "next";
import { getAssemblyBill } from "@/features/bills/server/loaders/get-assembly-bill";
import { resolveBillShareImageUrl } from "@/features/bills/shared/utils/bill-share-image";
import { TopicListPage } from "@/features/user-topic-analysis/server/components/topic-list-page";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

interface TopicsPageProps {
  params: Promise<{ assembly: string; id: string }>;
}

export async function generateMetadata({
  params,
}: TopicsPageProps): Promise<Metadata> {
  const { assembly, id } = await params;
  const bill = (await getAssemblyBill(assembly, id))?.bill;
  const billName = bill?.bill_content?.title || bill?.name || "議案";
  const title = `議案のトピック一覧 - ${billName}`;
  const description = `${billName}に寄せられた意見をAIが整理したトピック一覧`;
  const shareImageUrl = resolveBillShareImageUrl(bill, env.webUrl);

  return {
    title,
    description,
    alternates: {
      canonical: routes.billTopics(assembly, id),
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: shareImageUrl,
          alt: `${billName} のOGPイメージ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImageUrl],
    },
  };
}

export default async function TopicsPage({ params }: TopicsPageProps) {
  const { assembly, id } = await params;
  return <TopicListPage assemblySlug={assembly} billKey={id} />;
}
