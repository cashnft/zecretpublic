/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disabled for socket.io to work properly
    swcMinify: true,
    images: {
      domains: [],
    },
    async headers() {
      return [
        {
          // Apply these headers to all routes
          source: '/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ];
    },
  }
  
  module.exports = nextConfig