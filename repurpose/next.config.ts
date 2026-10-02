import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Next 15.x users: use `experimental: { reactCompiler: true }` and
  // `pnpm add -D babel-plugin-react-compiler` instead.
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["jsdom"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" }, // YouTube thumbnails (Phase 5)
      { protocol: "https", hostname: "img.clerk.com" }, // Clerk avatars (Phase 3)
    ],
  },
};

export default nextConfig;
