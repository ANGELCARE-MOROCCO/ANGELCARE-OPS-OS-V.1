import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // AC360_BUILD_STABILITY_LOCK
  // Prevent Vercel/Next webpack cache serialization crashes caused by very large AC360 French cockpit bundles.
  experimental: {
    webpackBuildWorker: false,
  },

  webpack: (config) => {
    config.cache = false
    return config
  },

  outputFileTracingIncludes: {
    '/api/academy/cohorts/[id]/pdf': ['node_modules/@sparticuz/chromium/bin/**/*'],
    '/api/academy/programs/[id]/pdf': ['node_modules/@sparticuz/chromium/bin/**/*'],
    '/api/academy/trainers/[id]/payments/[paymentId]/receipt/pdf': ['node_modules/@sparticuz/chromium/bin/**/*'],
  },

  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],

  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
