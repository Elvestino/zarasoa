import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { SITE_NAME } from "@/lib/site";

const OG_LOCALES: Record<string, string> = { fr: "fr_FR", en: "en_US", mg: "mg_MG" };

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  /** Pages à ne pas référencer (ex. lien de réinitialisation de mot de passe). */
  noindex?: boolean;
}

/** Titre, description, canonical, Open Graph et Twitter d'une page : un seul endroit pour rester cohérent. */
export async function pageMetadata({ title, description, path, noindex }: PageMetadataInput): Promise<Metadata> {
  const locale = await getLocale();
  const fullTitle = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale] ?? "fr_FR",
      title: fullTitle,
      description,
      url: path,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
