import "server-only";

import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { findAllPublishedBillKeys } from "../repositories/bill-repository";

export type SitemapBill = {
  id: string;
  slug: string | null;
  assembly_slug: string;
  updated_at: string;
};

/** サイトマップに載せる議案（全議会の公開済み。ダミーは除く。8.5.3節） */
export const getSitemapBills = unstable_cache(
  async (): Promise<SitemapBill[]> => {
    const rows = await findAllPublishedBillKeys();
    return rows.map(({ assembly, ...bill }) => ({
      ...bill,
      assembly_slug: assembly.slug,
    }));
  },
  ["sitemap-bills"],
  { revalidate: 3600, tags: [CACHE_TAGS.BILLS] }
);
