import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Enable Turbopack
  turbopack: {
    // Enable Turbopack for faster builds
  },

  // Optimize images for better performance
  images: {
    formats: ["image/webp", "image/avif"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.opensourcetoolkit.com",
        port: "",
        pathname: "/free-images/**",
      },
    ],
  },

  // Enable compression
  compress: true,
};

export default nextConfig;
