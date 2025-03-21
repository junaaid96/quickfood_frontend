import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['localhost', 'https://quickfood-backend-hoi3.onrender.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
  
      {
        protocol: 'https',
        hostname: 'https://quickfood-backend-hoi3.onrender.com',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
