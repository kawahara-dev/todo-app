import type { NextConfig } from "next";

const repo =
  process.env.NEXT_PUBLIC_GITHUB_REPOSITORY ??
  process.env.GITHUB_REPOSITORY?.split("/").pop() ??
  "";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd && repo ? `/${repo}` : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
