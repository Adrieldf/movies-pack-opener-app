import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/movies-pack-opener-app' : '';

const nextConfig: NextConfig = {
  output: 'export',
  // Adds the repository name as a prefix to all paths
  // Required for GitHub Pages when hosting on a subpath rather than a custom domain
  basePath,
  assetPrefix: isProd ? '/movies-pack-opener-app/' : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
