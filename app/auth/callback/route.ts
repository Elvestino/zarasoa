import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import { ROUTES } from "@/lib/constants";

/** Cible des liens e-mail Supabase (confirmation d'inscription, réinitialisation) : échange le code contre une session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.login;
  // Redirection interne uniquement (évite les « open redirect »).
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.login;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}${ROUTES.login}?error=lien_invalide`);
}
