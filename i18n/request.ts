import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, routing } from "./routing";

type Messages = { [key: string]: string | Messages };

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] = typeof value === "object" && typeof current === "object" ? deepMerge(current, value) : value;
  }
  return out;
}

/** Langue = cookie NEXT_LOCALE (sinon français). Aucun segment [locale] ni middleware de langue. */
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(routing.locales, fromCookie) ? fromCookie : routing.defaultLocale;
  // Le français sert de filet : une clé pas encore traduite dans une autre langue s'affiche en français plutôt que « Namespace.clé ».
  const fr = (await import("../messages/fr.json")).default as unknown as Messages;
  const messages = locale === routing.defaultLocale ? fr : deepMerge(fr, (await import(`../messages/${locale}.json`)).default as unknown as Messages);
  return { locale, messages };
});
