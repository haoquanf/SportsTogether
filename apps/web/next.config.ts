import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sportsapp/shared"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
