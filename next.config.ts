import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["bun:sqlite"],
  // Настройка для стандартного Webpack (на всякий случай)
  // webpack: (config, { isServer }) => {
  //   if (isServer) {
  //     config.externals.push("bun:sqlite");
  //   }
  //   return config;
  // },
};

export default nextConfig;
