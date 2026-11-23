import { NextResponse, type NextRequest } from "next/server";
import { GUEST_ONLY_ROUTES, PROTECTED_PREFIXES, ROUTES } from "@/lib/constants";
import { updateSession } from "@/shared/infrastructure/supabase/session";

/**
 * Rafraîchit la session Supabase et protège les routes. La langue n'est plus gérée ici :
 * elle vient du cookie NEXT_LOCALE (i18n/request.ts), il n'y a donc plus de middleware next-intl.
 */
export async function proxy(request: NextRequest) {
  // HTTPS obligatoire en production (derrière un reverse proxy, le protocole d'origine est dans x-forwarded-proto).
  // Exception : localhost, pour pouvoir tester `next start` en local sans certificat.
  if (process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-proto") === "http" && !isLocalHost(request.nextUrl.hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Routes sans page (API, callback des e-mails) : session seulement.
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) return response;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !user) return redirectKeepingCookies(request, response, ROUTES.login);
  if (user && (GUEST_ONLY_ROUTES as readonly string[]).includes(pathname)) {
    return redirectKeepingCookies(request, response, ROUTES.continue);
  }

  return response;
}

const isLocalHost = (hostname: string) => hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".local");

// Les cookies de session éventuellement rafraîchis doivent suivre la redirection.
function redirectKeepingCookies(request: NextRequest, source: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  source.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|twitter-image|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
