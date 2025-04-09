/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // Moved from experimental to root level
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // instrumentationHook removed as it's available by default
  },
  // Configure longer timeouts for API routes
  serverRuntimeConfig: {
    api: {
      bodyParser: {
        sizeLimit: '2mb',
      },
      responseLimit: '8mb',
    },
  },
}

module.exports = nextConfig 