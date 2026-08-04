import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { resolve } from "node:path";

// Monorepo: shared secrets live in the repo root `.env`.
loadEnvConfig(resolve(__dirname, "../.."));

const nextConfig: NextConfig = {
  transpilePackages: ["@black-swan/ui", "@black-swan/domain", "@black-swan/db"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "k.kakaocdn.net" },
    ],
  },
};

export default nextConfig;
