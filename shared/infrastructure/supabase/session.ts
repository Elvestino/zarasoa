import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { getPublicEnv } from "./env";

/** Rafraîchit la session Supabase à chaque requête (à appeler depuis middleware.ts). */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() revalide le jeton auprès de Supabase Auth (ne pas se fier à getSession() côté serveur).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
