import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
