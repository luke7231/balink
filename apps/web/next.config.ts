import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";

// Local monorepo: shared secrets live in the repo root `.env`.
// On Vercel, platform env vars are already injected — skip to avoid NFT tracing the whole repo.
if (!process.env.VERCEL) {
  loadEnvConfig(resolve(__dirname, "../.."));
}

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "http", hostname: "k.kakaocdn.net" },
  { protocol: "https", hostname: "k.kakaocdn.net" },
];

const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim();
if (publicBaseUrl) {
  try {
    const { protocol, hostname, port } = new URL(publicBaseUrl);
    remotePatterns.push({
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      ...(port ? { port } : {}),
    });
  } catch {
    // ignore invalid public base URL
  }
}

const allowedDevOrigins = Object.values(networkInterfaces())
  .flatMap((entries) => entries ?? [])
  .filter((entry) => entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry.address);

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, "../.."),
  transpilePackages: ["@balink/ui", "@balink/domain", "@balink/db"],
  allowedDevOrigins,
  images: {
    remotePatterns,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "balink.co.kr" }],
        destination: "https://www.balink.co.kr/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
