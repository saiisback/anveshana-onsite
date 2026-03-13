/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["resend", "bcryptjs", "@prisma/client", "better-auth"],
};

export default nextConfig;
