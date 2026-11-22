/**
 * Seed ZARASOA : (re)crée le compte SUPER ADMIN dans Supabase.
 *
 * Idempotent : on peut le relancer autant de fois que nécessaire (après `db:reset`, par exemple).
 *   - si l'utilisateur Auth n'existe pas, il est créé (e-mail déjà confirmé) ;
 *   - s'il existe, son mot de passe est remis à la valeur de SEED_ADMIN_PASSWORD ;
 *   - son profil est (re)créé si besoin, approuvé et débloqué ;
 *   - le rôle `super_admin` lui est attribué s'il ne l'a pas déjà.
 *
 * Les identifiants viennent de .env.local (jamais écrits dans le code, pour ne pas finir dans Git) :
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, et facultativement SEED_ADMIN_FIRST_NAME / SEED_ADMIN_LAST_NAME.
 *
 * Lancement : npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../shared/infrastructure/supabase/database.types";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable manquante : ${name} (à définir dans .env.local)`);
  }
  return value;
}

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = required("SUPABASE_SECRET_KEY");
  const email = required("SEED_ADMIN_EMAIL").toLowerCase();
  const password = required("SEED_ADMIN_PASSWORD");
  const firstName = process.env.SEED_ADMIN_FIRST_NAME?.trim() || "Admin";
  const lastName = process.env.SEED_ADMIN_LAST_NAME?.trim() || "Zarasoa";

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD doit contenir au moins 8 caractères.");
  }

  // La clé secrète contourne RLS et les gardes (auth.uid() est nul) : ce script ne doit tourner qu'en local / en CI de confiance.
  const admin = createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Utilisateur Supabase Auth
  const metadata = { first_name: firstName, last_name: lastName };
  const existingId = await findAuthUserId(email);
  let userId: string;

  if (existingId) {
    const { error } = await admin.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(`Mise à jour de l'utilisateur Auth : ${error.message}`);
    userId = existingId;
    console.log(`• Utilisateur Auth existant mis à jour : ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) throw new Error(`Création de l'utilisateur Auth : ${error?.message ?? "réponse vide"}`);
    userId = data.user.id;
    console.log(`• Utilisateur Auth créé : ${email}`);
  }

  // 2) Profil : normalement créé par le trigger on_auth_user_created ; on le recrée s'il a été effacé (cas d'un reset partiel).
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      account_status: "approved",
      failed_login_count: 0,
      locked_at: null,
      deactivated_at: null,
      deleted_at: null,
    },
    { onConflict: "id" },
  );
  if (profileError) throw new Error(`Profil : ${profileError.message}`);
  console.log("• Profil approuvé");

  // 3) Rôle super_admin (un seul rôle actif par utilisateur et par code)
  const { data: activeRole, error: roleLookupError } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role_code", "super_admin")
    .is("revoked_at", null)
    .maybeSingle();
  if (roleLookupError) throw new Error(`Lecture du rôle : ${roleLookupError.message}`);

  if (activeRole) {
    console.log("• Rôle super_admin déjà attribué");
  } else {
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role_code: "super_admin", assigned_by: null });
    if (roleError) throw new Error(`Attribution du rôle : ${roleError.message}`);
    console.log("• Rôle super_admin attribué");
  }

  console.log(`\n✔ Seed terminé. Connexion possible avec ${email}`);

  /** Cherche un utilisateur Auth par e-mail (l'API n'offre pas de recherche directe : on pagine). */
  async function findAuthUserId(target: string): Promise<string | null> {
    const perPage = 200;
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`Liste des utilisateurs Auth : ${error.message}`);
      const found = data.users.find((u) => u.email?.toLowerCase() === target);
      if (found) return found.id;
      if (data.users.length < perPage) return null;
    }
  }
}

main().catch((err: unknown) => {
  console.error(`\n✖ Seed échoué : ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
