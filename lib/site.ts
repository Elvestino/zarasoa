export const SITE_NAME = "ZARASOA";

/** URL publique du site (canonical, sitemap, Open Graph). À définir en production : NEXT_PUBLIC_SITE_URL. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const raw = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

/** Adresse de contact affichée dans les pages légales (optionnelle). */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
