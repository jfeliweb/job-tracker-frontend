import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/:path*`
          : 'http://localhost:8080/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/backend/:path*',
        headers: [
          { key: 'x-forwarded-host', value: 'localhost:3000' },
        ],
      },
    ]
  },
}

export default nextConfig