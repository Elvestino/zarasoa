import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getPublicEnv } from "./env";

/** Client navigateur (composants "use client"). Soumis à RLS. */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getPublicEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
