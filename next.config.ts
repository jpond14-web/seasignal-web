import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://*.supabase.co/storage/**")],
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

export default nextConfig;
