import "server-only";
import { createSupabaseAdminClient } from "./admin";
import { createSupabaseServerClient } from "./server";

export interface HealthReport {
  ok: boolean;
  publishableKey: boolean;
  secretKey: boolean;
  database: "ok" | "migrations_missing" | "unreachable" | "not_checked";
  levels?: number;
  detail?: string;
}

export async function checkSupabaseConnection(): Promise<HealthReport> {
  const report: HealthReport = {
    ok: false,
    publishableKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    secretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
    database: "not_checked",
  };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !report.publishableKey) {
    report.detail = "NEXT_PUBLIC_SUPABASE_URL / clé publiable manquantes";
    return report;
  }

  try {
    if (report.secretKey) {
      // Avec la clé secrète : lecture réelle de academic_levels (5 niveaux attendus après migrations).
      const { count, error } = await createSupabaseAdminClient()
        .from("academic_levels")
        .select("id", { count: "exact", head: true });
      if (error) {
        report.database = error.code === "42P01" || error.code === "PGRST205" ? "migrations_missing" : "unreachable";
        report.detail = error.message;
      } else {
        report.database = "ok";
        report.levels = count ?? 0;
        report.ok = true;
      }
    } else {
      // Sans clé secrète : l'accès anonyme est refusé par conception (permission denied = base joignable).
      const { error } = await (await createSupabaseServerClient()).from("academic_levels").select("id").limit(1);
      const reachable = !error || error.code === "42501";
      report.database = reachable ? "ok" : error?.code === "PGRST205" ? "migrations_missing" : "unreachable";
      report.ok = reachable;
      report.detail = "SUPABASE_SECRET_KEY absente : vérification limitée à la joignabilité";
    }
  } catch (e) {
    report.database = "unreachable";
    report.detail = e instanceof Error ? e.message : "Erreur inconnue";
  }
  return report;
}
