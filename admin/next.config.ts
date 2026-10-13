import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  experimental: {
    serverSourceMaps: true,
    // サムネイル（5MB まで）を Server Action で送るため
    serverActions: { bodySizeLimit: "6mb" },
  },
  typedRoutes: true,
  turbopack: {
    root: "../",
  },
  images: {
    remotePatterns: [
      // サムネイルなどの公開ファイル（Vercel Blob の公開 URL）
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      ...(isDev
        ? [
            {
              protocol: "https" as const,
              hostname: "placehold.co",
            },
            // Blob が無いローカル開発の置き場所（web/public/local-storage）
            {
              protocol: "http" as const,
              hostname: "localhost",
              pathname: "/local-storage/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
