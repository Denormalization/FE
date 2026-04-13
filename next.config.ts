import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://be-production-4099.up.railway.app";
const aiUrl = process.env.AI_API_URL ?? "https://ai-production-e966.up.railway.app";

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
