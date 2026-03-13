/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["better-auth"],
  serverExternalPackages: ["resend", "bcryptjs", "@prisma/client"],
};

export default nextConfig;
