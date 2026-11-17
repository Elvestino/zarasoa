import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getPublicEnv, getSecretKey } from "./env";

/**
 * Client PRIVILÉGIÉ : contourne RLS. Réservé aux opérations serveur sensibles
 * (import du registre, comptage des échecs de connexion, bannissement/débannissement Auth…).
 * Ne jamais l'exposer au navigateur ni le renvoyer dans une réponse.
 */
export function createSupabaseAdminClient() {
  const { url } = getPublicEnv();
  return createClient<Database>(url, getSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
