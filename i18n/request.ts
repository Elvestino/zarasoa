import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, routing } from "./routing";

/** Langue = cookie NEXT_LOCALE (sinon français). Aucun segment [locale] ni middleware de langue. */
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(routing.locales, fromCookie) ? fromCookie : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
