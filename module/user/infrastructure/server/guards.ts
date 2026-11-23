import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { ApiError } from "@/shared/errors/ApiError";
import type { Db } from "@/shared/infrastructure/repository/BaseRepository";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";
import type { Profile } from "../../domain/entities/Profile";
import type { RoleCode } from "../../domain/value-object/Role";
import { ProfileRepository } from "../repository/ProfileRepository";

/** Espace d'arrivée de chaque rôle. */
export const ROLE_HOME: Record<RoleCode, string> = {
  super_admin: ROUTES.admin,
  professor: ROUTES.professor,
  student: ROUTES.student,
};
const ROLE_PRIORITY: RoleCode[] = ["super_admin", "professor", "student"];

export function homeFor(profile: Profile): string | null {
  const role = ROLE_PRIORITY.find((r) => profile.roles.includes(r));
  return role ? ROLE_HOME[role] : null;
}

/** Code d'erreur (AUTH_ERROR_CODES) si le compte n'a PAS le droit d'ouvrir une session applicative, sinon null. */
export function blockCode(profile: Profile | null): string | null {
  if (!profile || profile.deletedAt) return "ACCOUNT_INACTIVE";
  switch (profile.accountStatus) {
    case "approved":
      return null;
    case "locked":
      return "ACCOUNT_LOCKED";
    case "pending_email":
      return "EMAIL_NOT_CONFIRMED";
    case "pending_admin":
      return "ACCOUNT_PENDING_ADMIN";
    case "rejected":
      return "ACCOUNT_REJECTED";
    default:
      return "ACCOUNT_INACTIVE";
  }
}

/** Profil de l'utilisateur connecté (null sans session). Mis en cache le temps d'une requête. */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user ? new ProfileRepository(db).findById(user.id) : null;
});

/**
 * Garde des layouts d'espace : exige une session, un compte approuvé et le bon rôle.
 * Sinon, /auth/continue déconnecte (compte bloqué) ou renvoie l'utilisateur vers son propre espace.
 * La RLS reste la vraie barrière pour les données ; ceci évite d'afficher un espace qui n'est pas le sien.
 */
export async function requireRole(role: RoleCode): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect(ROUTES.login);
  if (blockCode(profile) || !profile.roles.includes(role)) redirect(ROUTES.continue);
  return profile;
}

/** Garde des Server Actions (joignables en POST direct) : lève ApiError 403 si l'appelant n'a pas le rôle. */
export async function requireRoleForAction(role: RoleCode): Promise<{ db: Db; profile: Profile }> {
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const profile = user ? await new ProfileRepository(db).findById(user.id) : null;
  if (!profile || blockCode(profile) || !profile.roles.includes(role)) {
    throw new ApiError("Accès refusé.", 403, "FORBIDDEN");
  }
  return { db, profile };
}
