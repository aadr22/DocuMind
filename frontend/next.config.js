/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // appDir is no longer needed in Next.js 14
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
