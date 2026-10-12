import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const r2PublicUrl = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL)
  : null;

const nextConfig: NextConfig = {
  experimental: {
    serverSourceMaps: true,
  },
  typedRoutes: true,
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      // サムネイルなどの公開ファイル（Cloudflare R2 の公開 URL）
      ...(r2PublicUrl
        ? [
            {
              protocol: r2PublicUrl.protocol.replace(":", "") as
                | "http"
                | "https",
              hostname: r2PublicUrl.hostname,
            },
          ]
        : []),
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "placehold.co",
            },
          ]
        : []),
    ],
    ...(isDev && {
      dangerouslyAllowSVG: true,
      contentDispositionType: "attachment" as const,
      contentSecurityPolicy:
        "default-src 'self'; script-src 'none'; sandbox;",
    }),
  },
};

export default nextConfig;
