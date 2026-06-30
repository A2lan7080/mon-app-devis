import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/devis/send": ["node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
