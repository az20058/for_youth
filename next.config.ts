import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['until-async', 'rettime', 'type-fest', 'tough-cookie'],
};

export default nextConfig;
