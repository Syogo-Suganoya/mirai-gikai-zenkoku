import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * 検索エンジン向けの案内。サイトマップの場所を伝え、プレビュー（トークン付きの下書き）・
 * 開発用ページ・API は巡回させない。ダミーの議会は各ページの noindex で外す。
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.webUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/preview/", "/dev/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
