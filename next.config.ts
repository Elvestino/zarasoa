import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// En-têtes de sécurité : HTTPS forcé (HSTS) et durcissement du navigateur.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    // AVIF/WebP générés à la demande : les images sont servies compressées et à la bonne taille.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // Anciennes URLs avec préfixe de langue → même page sans préfixe, langue mémorisée dans le cookie.
      { source: "/:locale(fr|en|mg)", destination: "/set-locale?locale=:locale&to=/", permanent: false },
      { source: "/:locale(fr|en|mg)/:path+", destination: "/set-locale?locale=:locale&to=/:path*", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
