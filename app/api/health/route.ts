import { NextResponse } from "next/server";
import { checkSupabaseConnection } from "@/shared/infrastructure/supabase/health";

// Route de diagnostic : désactivée en production.
// (pas de `export const dynamic` : incompatible avec `cacheComponents`, et un handler GET est déjà dynamique.)
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const report = await checkSupabaseConnection();
  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
