import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import { blockCode, homeFor } from "@/module/user/infrastructure/server/guards";
import { ProfileRepository } from "@/module/user/infrastructure/repository/ProfileRepository";

/**
 * Point d'entrée après connexion, confirmation d'e-mail ou lien de réinitialisation.
 * Le serveur décide : compte non approuvé / bloqué / sans rôle → session fermée + message sur /login ;
 * sinon → espace du rôle (admin, professeur, étudiant). Aucune session ne survit à un compte non autorisé.
 */
export async function GET() {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const profile = await new ProfileRepository(db).findById(user.id);
  const home = profile ? homeFor(profile) : null;
  const code = blockCode(profile) ?? (home ? null : "NO_ROLE");

  if (code || !home) {
    await db.auth.signOut();
    redirect(`${ROUTES.login}?error=${code ?? "NO_ROLE"}`);
  }
  redirect(home);
}
