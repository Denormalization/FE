import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL;
const aiUrl = process.env.AI_API_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/api/ai/:path*",
        destination: `${aiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
