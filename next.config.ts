import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
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
