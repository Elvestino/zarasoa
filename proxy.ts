import { NextResponse, type NextRequest } from "next/server";
import { GUEST_ONLY_ROUTES, PROTECTED_PREFIXES, ROUTES } from "@/lib/constants";
import { updateSession } from "@/shared/infrastructure/supabase/session";

/**
 * Next.js 16 : `proxy.ts` remplace `middleware.ts`.
 * Rafraîchit la session Supabase puis applique les redirections simples.
 * Le contrôle fin par rôle et statut de compte viendra au sprint 1 ; la RLS reste la vraie barrière.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !user) {
    return redirectWithCookies(request, response, ROUTES.login);
  }
  if (user && (GUEST_ONLY_ROUTES as readonly string[]).includes(pathname)) {
    return redirectWithCookies(request, response, ROUTES.home);
  }
  return response;
}

/** Une redirection doit conserver les cookies de session éventuellement rafraîchis. */
function redirectWithCookies(request: NextRequest, source: NextResponse, path: string) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  source.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
