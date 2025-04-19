/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-inventory-develop.softmate.xyz',
      },
      {
        protocol: 'https',
        hostname: 'pub-01ab921568614e369e392f548902259d.r2.dev',
      },
    ]
  }
};

export default nextConfig;
