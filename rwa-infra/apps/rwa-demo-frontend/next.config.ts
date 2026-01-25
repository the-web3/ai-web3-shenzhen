import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid dev cross-origin warnings when accessing via different localhost/IP hostnames.
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.122:3000"],
  // Disable scroll restoration to prevent auto-scroll on refresh
  experimental: {
    scrollRestoration: false,
  },
};

export default nextConfig;
