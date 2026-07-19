import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { NextConfig } from 'next';

const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
