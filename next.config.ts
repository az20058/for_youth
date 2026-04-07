import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['until-async', 'rettime', 'type-fest', 'tough-cookie'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net',
      },
    ],
  },
};

export default nextConfig;
