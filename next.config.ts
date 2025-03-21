import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['localhost', ''],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
  
      {
        protocol: 'https',
        hostname: '',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
