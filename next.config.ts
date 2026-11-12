import type { NextConfig } from "next";

/** 検索エンジンに載せず、ほかのサイトの枠の中で開かれないようにする */
const SECURITY_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
];

/**
 * STATIC_EXPORT=1 のときは、サーバーなしで動く HTML の束 (out/) を作る (GitHub Pages 用)。
 * BASE_PATH は置き場所の下の階層 (例: /ceo-academy)。ふだん (Vercel) は使わない
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = isStaticExport ? (process.env.BASE_PATH ?? "") : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(isStaticExport
    ? { output: "export", basePath, trailingSlash: true }
    : {
        async headers() {
          return [{ source: "/:path*", headers: SECURITY_HEADERS }];
        },
      }),
};

export default nextConfig;
