import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "speedy-move.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
