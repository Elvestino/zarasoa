import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@/components/analytics/Analytics";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_NAME, getSiteUrl } from "@/lib/site";
import { AuthProviders } from "@/shared/providers/AuthProviders";

// Poppins : police unique du projet (texte et titres).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const OG_LOCALES: Record<string, string> = { fr: "fr_FR", en: "en_US", mg: "mg_MG" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const locale = await getLocale();
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: t("homeTitle"), template: `%s — ${t("title")}` },
    description: t("description"),
    applicationName: SITE_NAME,
    alternates: { canonical: "./" },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale] ?? "fr_FR",
      title: t("homeTitle"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image", title: t("homeTitle"), description: t("description") },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#011c86" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1330" },
  ],
};

// Applique le thème (clair/sombre) avant l'affichage pour éviter le flash.
const themeScript = `try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = await getLocale();
  const tc = await getTranslations("Common");

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${poppins.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-full focus:bg-secondary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-secondary-foreground"
        >
          {tc("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <AuthProviders>
            <TooltipProvider>
              <Header />
              <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">{children}</main>
              <Footer />
              <CookieConsent />
              <Analytics />
            </TooltipProvider>
          </AuthProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
