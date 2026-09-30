import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // NO output: 'export' — this app uses SSR for SEO (deploy to AWS Amplify)
  reactStrictMode: true,
  transpilePackages: ['@sancus-flow/ui'],
};

export default nextConfig;
