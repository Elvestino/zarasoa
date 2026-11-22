import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, ROUTES } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((path) => ({
    url: path === ROUTES.home ? base : `${base}${path}`,
    lastModified,
    changeFrequency: path === ROUTES.home ? "weekly" : "monthly",
    priority: path === ROUTES.home ? 1 : path === ROUTES.register || path === ROUTES.login ? 0.7 : 0.3,
  }));
}
