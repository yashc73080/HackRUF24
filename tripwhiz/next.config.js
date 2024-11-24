/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // For static site export
  images: {
    unoptimized: true  // Disable image optimization for static export
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL || 'https://your-backend-service.onrender.com'
  }
};

module.exports = nextConfig;
