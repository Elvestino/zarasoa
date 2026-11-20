import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, routing } from "@/i18n/routing";


export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const locale = searchParams.get("locale");
  const rawTarget = searchParams.get("to") ?? "/";
  // Redirection interne uniquement (évite les « open redirect »).
  const target = rawTarget.startsWith("/") && !rawTarget.startsWith("//") && !rawTarget.includes("\\") ? rawTarget : "/";

  const destination = new URL(target, request.url);
  searchParams.forEach((value, key) => {
    if (key !== "locale" && key !== "to") destination.searchParams.append(key, value);
  });

  const response = NextResponse.redirect(destination);
  if (hasLocale(routing.locales, locale)) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}
