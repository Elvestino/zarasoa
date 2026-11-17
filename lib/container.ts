import "server-only";
import { AcademicLevelRepository } from "@/module/catalog/infrastructure/repository/AcademicLevelRepository";
import { AuthEndpoint } from "@/module/auth/infrastructure/api/AuthEndpoint";
import { AuthRepository } from "@/module/auth/infrastructure/repository/AuthRepository";
import { LoginService } from "@/module/auth/infrastructure/server/LoginService";
import { RegisterService } from "@/module/auth/infrastructure/server/RegisterService";
import { ProfileRepository } from "@/module/user/infrastructure/repository/ProfileRepository";
import { createSupabaseAdminClient } from "@/shared/infrastructure/supabase/admin";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

/**
 * Composition root SERVEUR : seul endroit qui associe les interfaces des modules
 * à leurs implémentations Supabase. À étendre module par module.
 */
export async function getContainer(siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") {
  const db = await createSupabaseServerClient();
  const profiles = new ProfileRepository(db);

  return {
    auth: new AuthRepository(new AuthEndpoint(db), siteUrl),
    profiles,
    academicLevels: new AcademicLevelRepository(db),
    loginService: new LoginService(db, createSupabaseAdminClient, profiles),
    registerService: new RegisterService(db, createSupabaseAdminClient, siteUrl),
  };
}
