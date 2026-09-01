import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs is browser-only. Never bundle canvas / Node extras.
  serverExternalPackages: ["pdfjs-dist"],
  // Next.js 16 uses Turbopack by default; keep an empty config so a webpack
  // alias for optional `canvas` does not fail the production build.
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
