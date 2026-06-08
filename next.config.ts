import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
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