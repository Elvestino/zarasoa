import { defineRouting } from "next-intl/routing";


export const routing = defineRouting({
  locales: ["fr", "en", "mg"],
  defaultLocale: "fr",
  localePrefix: "never",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = { fr: "Français", en: "English", mg: "Malagasy" };
