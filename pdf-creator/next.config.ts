import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude @react-pdf/renderer from the server-side bundle (browser-only APIs).
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {},
  devIndicators: false,
};

export default nextConfig;
