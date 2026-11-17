import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getPublicEnv } from "./env";

/** Client serveur (Server Components, Server Actions, Route Handlers). Session via cookies, soumis à RLS. */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appel depuis un Server Component : le middleware rafraîchit déjà la session.
        }
      },
    },
  });
}
