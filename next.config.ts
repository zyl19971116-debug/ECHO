import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // BullMQ is a Node-only runtime dependency. Keeping it external prevents
  // Next from traversing its unused optional Valkey Glide adapter.
  serverExternalPackages: ["bullmq"],
};
export default nextConfig;
