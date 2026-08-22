import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8745", pathname: "/**" },
      { protocol: "https", hostname: "resposbackend.onrender.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8745/api/:path*',
        // destination: 'https://resposbackend.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
