import "server-only";
import { CourseRepository } from "@/module/course/infrastructure/repository/CourseRepository";
import { FiliereRepository } from "@/module/catalog/infrastructure/repository/FiliereRepository";
import { RegistryImportRepository } from "@/module/registry/infrastructure/repository/RegistryImportRepository";
import { RegistrationRequestRepository } from "@/module/student/infrastructure/repository/RegistrationRequestRepository";
import { StudentRepository } from "@/module/student/infrastructure/repository/StudentRepository";
import { AccountRepository } from "@/module/user/infrastructure/repository/AccountRepository";
import { AcademicLevelRepository } from "@/module/catalog/infrastructure/repository/AcademicLevelRepository";
import { AuthEndpoint } from "@/module/auth/infrastructure/api/AuthEndpoint";
import { AuthRepository } from "@/module/auth/infrastructure/repository/AuthRepository";
import { LoginService } from "@/module/auth/infrastructure/server/LoginService";
import { RegisterService } from "@/module/auth/infrastructure/server/RegisterService";
import { ProfileRepository } from "@/module/user/infrastructure/repository/ProfileRepository";
import { createSupabaseAdminClient } from "@/shared/infrastructure/supabase/admin";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

export async function getContainer(siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") {
  const db = await createSupabaseServerClient();
  const profiles = new ProfileRepository(db);

  return {
    auth: new AuthRepository(new AuthEndpoint(db), siteUrl),
    profiles,
    academicLevels: new AcademicLevelRepository(db),
    filieres: new FiliereRepository(db),
    students: new StudentRepository(db),
    registrationRequests: new RegistrationRequestRepository(db),
    registryImports: new RegistryImportRepository(db),
    accounts: new AccountRepository(db),
    courses: new CourseRepository(db),
    loginService: new LoginService(db, createSupabaseAdminClient, profiles),
    registerService: new RegisterService(db, createSupabaseAdminClient, siteUrl),
  };
}
