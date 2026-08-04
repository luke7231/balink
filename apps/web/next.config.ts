import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { resolve } from "node:path";

// Monorepo: shared secrets live in the repo root `.env`.
loadEnvConfig(resolve(__dirname, "../.."));

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

const nextConfig: NextConfig = {
  transpilePackages: ["@black-swan/ui", "@black-swan/domain", "@black-swan/db"],
  images: {
    remotePatterns,
  },
};

export default nextConfig;
