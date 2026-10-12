import type { MetadataRoute } from "next";
import { getAssemblySummaries } from "@/features/assemblies/server/loaders/get-assembly-summaries";
import { getSitemapBills } from "@/features/bills/server/loaders/get-sitemap-bills";
import { billDetailHref } from "@/features/bills/shared/utils/bill-href";
import { env } from "@/lib/env";
import { routes } from "@/lib/routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.webUrl.replace(/\/$/, "");

  const [assemblies, bills] = await Promise.all([
    getAssemblySummaries(),
    getSitemapBills(),
  ]);

  // ダミーだけの議会は noindex なので載せない（8.5.3節）
  const assemblyUrls = assemblies
    .filter((assembly) => !assembly.dummyOnly)
    .flatMap((assembly) => [
      {
        url: `${baseUrl}${routes.assemblyTop(assembly.slug)}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}${routes.billsList(assembly.slug)}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
    ]);

  const billUrls = bills.map((bill) => ({
    url: `${baseUrl}${billDetailHref(bill)}`,
    lastModified: new Date(bill.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...assemblyUrls,
    ...billUrls,
  ];
}
