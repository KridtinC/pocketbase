import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

// Enable Cloudflare bindings in local dev (wrangler pages dev)
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform().catch(() => {});
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is for Docker; Cloudflare Pages uses its own output via next-on-pages
  ...(process.env.CF_PAGES ? {} : { output: "standalone" }),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
