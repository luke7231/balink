import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@black-swan/ui", "@black-swan/domain"],
};

export default nextConfig;
