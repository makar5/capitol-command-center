/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the seeded SQLite file is included in serverless function bundles
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./prisma/demo.db"],
    },
  },
};

export default nextConfig;
