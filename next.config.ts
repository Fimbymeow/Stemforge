import type { NextConfig } from "next";
import { createSecurityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  // Keep the development launcher from obscuring narrow learner-content previews.
  devIndicators: false,
  async headers() {
    return [{ source: "/(.*)", headers: createSecurityHeaders(process.env.NODE_ENV === "production") }];
  },
};

export default nextConfig;
