import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/set-locale", "/reset-password", "/etudiant", "/professeur", "/admin", "/demande"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
