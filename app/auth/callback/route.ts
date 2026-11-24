import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import { ROUTES } from "@/lib/constants";

/**
 * Cible des liens e-mail Supabase (confirmation d'inscription, réinitialisation) : échange le code contre une session.
 * Lien expiré (validité 1 h, réglage « Email OTP expiration » de Supabase), déjà utilisé ou invalide → page /link-expired.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.login;
  // Redirection interne uniquement (évite les « open redirect »).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.login;
  // Le type de lien détermine le texte de la page d'expiration (réinitialisation ou confirmation d'inscription).
  const type = safeNext.startsWith(ROUTES.resetPassword) ? "recovery" : "signup";

  // Supabase renvoie ?error=…&error_code=otp_expired quand le lien a dépassé sa durée de validité.
  if (code && !searchParams.get("error")) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}${ROUTES.linkExpired}?type=${type}`);
}
