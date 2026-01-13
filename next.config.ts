import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["bun:sqlite"],
  turbopack: {
    rules: {
      // Описываем правило для SVG
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js", // Говорим турбопаку трактовать это как JS компонент
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: [{ loader: "@svgr/webpack", options: { icon: true } }],
    });
    return config;
  },
};

export default nextConfig;
