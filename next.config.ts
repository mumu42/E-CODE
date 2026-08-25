import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** 在 Capacitor / WebView 等环境中不依赖外部 Image Optimization 服务 */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
