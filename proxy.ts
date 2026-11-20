import { NextResponse, type NextRequest } from "next/server";
import { GUEST_ONLY_ROUTES, PROTECTED_PREFIXES, ROUTES } from "@/lib/constants";
import { updateSession } from "@/shared/infrastructure/supabase/session";

/**
 * Rafraîchit la session Supabase et protège les routes. La langue n'est plus gérée ici :
 * elle vient du cookie NEXT_LOCALE (i18n/request.ts), il n'y a donc plus de middleware next-intl.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Routes sans page (API, callback des e-mails) : session seulement.
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) return response;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !user) return redirectKeepingCookies(request, response, ROUTES.login);
  if (user && (GUEST_ONLY_ROUTES as readonly string[]).includes(pathname)) {
    return redirectKeepingCookies(request, response, ROUTES.home);
  }

  return response;
}

// Les cookies de session éventuellement rafraîchis doivent suivre la redirection.
function redirectKeepingCookies(request: NextRequest, source: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  source.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/data|favicon.ico|icon.png|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
