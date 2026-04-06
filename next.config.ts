import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://*.supabase.co/storage/**")],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/home", permanent: true },
      { source: "/forums", destination: "/community/forums", permanent: true },
      { source: "/forums/:path*", destination: "/community/forums/:path*", permanent: true },
      { source: "/seafarers", destination: "/community/seafarers", permanent: true },
      { source: "/seafarers/:path*", destination: "/community/seafarers/:path*", permanent: true },
      { source: "/companies", destination: "/intel/companies", permanent: true },
      { source: "/companies/:path*", destination: "/intel/companies/:path*", permanent: true },
      { source: "/agencies", destination: "/intel/agencies", permanent: true },
      { source: "/agencies/:path*", destination: "/intel/agencies/:path*", permanent: true },
      { source: "/vessels", destination: "/intel/vessels", permanent: true },
      { source: "/vessels/:path*", destination: "/intel/vessels/:path*", permanent: true },
      { source: "/pay", destination: "/intel/pay", permanent: true },
      { source: "/certs", destination: "/career/certs", permanent: true },
      { source: "/sea-time", destination: "/career/sea-time", permanent: true },
      { source: "/contract-check", destination: "/career/contract-check", permanent: true },
      { source: "/jobs", destination: "/career/jobs", permanent: true },
      { source: "/jobs/:path*", destination: "/career/jobs/:path*", permanent: true },
      { source: "/incidents", destination: "/welfare/incidents", permanent: true },
      { source: "/rights", destination: "/welfare/rights", permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "harbour-and-hills-stays",
  project: "seasignal-web",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
