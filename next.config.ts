import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'preview-chat-c24cbbea-237b-4168-811e-89b6194c4934.space.z.ai',
    '.space.z.ai',
    'localhost:3000',
  ],
};

export default nextConfig;
