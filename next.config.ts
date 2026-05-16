import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    deviceSizes: [320, 420, 768, 1024, 1440],
    imageSizes: [64, 96, 128, 192, 256],
    formats: ["image/avif", "image/webp"],
  },
};

export default withSerwist(nextConfig);
