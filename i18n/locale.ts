"use server";

import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, routing } from "./routing";

/** Server Action : mémorise la langue choisie. Next re-rend ensuite la page courante avec les nouveaux textes. */
export async function setLocale(locale: string): Promise<void> {
  if (!hasLocale(routing.locales, locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
