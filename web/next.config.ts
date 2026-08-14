import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native (napi-rs) module — must run via Node's require, not get bundled
  // into the route handler's ESM chunk.
  serverExternalPackages: ["@firecrawl/pdf-inspector"],
};

export default nextConfig;
