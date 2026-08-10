import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // destination: 'http://localhost:8745/api/:path*',
        destination: 'https://resposbackend.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
