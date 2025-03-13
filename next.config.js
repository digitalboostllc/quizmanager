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
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable server-side instrumentation
    instrumentationHook: true,
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