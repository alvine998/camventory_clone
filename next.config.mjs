// import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api-inventory-develop.softmate.xyz",
      },
      {
        protocol: "https",
        hostname: "pub-01ab921568614e369e392f548902259d.r2.dev",
      },
      {
        protocol: "https",
        hostname: "api-cdn.softmate.my.id",
      },
       {
        protocol: "https",
        hostname: "cdn-stg.nusabooking.com",
      },
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  async headers() {
    return [
      {
        source: "/main/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=120",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "https://api-dev-inventory.softmate.my.id/:path*",
      },
      {
        source: "/api-proxy/:path*",
        destination: "https://api-stg-inventory.softmate.my.id/:path*",
      },
    ];
  },
};

// export default withSentryConfig(nextConfig, {
//   org: process.env.SENTRY_ORG || "",
//   project: process.env.SENTRY_PROJECT || "",
//   authToken: process.env.SENTRY_AUTH_TOKEN,
//   silent: false,
//   hideSourceMaps: true,
//   dryRun: process.env.NODE_ENV === "development",
// });

export default nextConfig;
