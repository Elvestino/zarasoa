"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { setLocale } from "@/i18n/locale";
import { Password } from "@/module/auth/domain/value-object/Password";
import type { ActionResult } from "@/shared/domain/Page";
import { failure } from "@/shared/infrastructure/actionError";
import { getPublicEnv } from "@/shared/infrastructure/supabase/env";
import { ApiError } from "@/shared/errors/ApiError";
import { DomainError } from "@/shared/errors/DomainError";
import { validateProfileUpdate } from "../../domain/entities/ProfileUpdate";
import { ROLE_CODES } from "../../domain/value-object/Role";
import { getSessionProfile, blockCode } from "./guards";
import { createSupabaseServerClient } from "@/shared/infrastructure/supabase/server";

/** Utilisateur connecté, compte approuvé (n'importe quel rôle). */
async function currentMember() {
  const profile = await getSessionProfile();
  if (!profile || blockCode(profile) || !profile.roles.some((r) => (ROLE_CODES as readonly string[]).includes(r))) {
    throw new ApiError("Accès refusé.", 403, "FORBIDDEN");
  }
  return profile;
}

/**
 * Ré-authentification par mot de passe SANS toucher à la session en cours (client sans cookies).
 * Exigée avant les actions sensibles : changer le mot de passe, désactiver ou supprimer son compte.
 */
async function reauthenticate(userId: string, email: string, password: unknown): Promise<void> {
  if (!rateLimit(`reauth:${userId}`, 5, 10 * 60_000).ok) throw new ApiError("Trop de tentatives.", 429, "RATE_LIMITED");
  if (typeof password !== "string" || password.length === 0 || password.length > 256) {
    throw new DomainError("Mot de passe incorrect.", "INVALID_CREDENTIALS");
  }
  const { url, publishableKey } = getPublicEnv();
  const stateless = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await stateless.auth.signInWithPassword({ email, password });
  if (error) throw new DomainError("Mot de passe incorrect.", "INVALID_CREDENTIALS");
}

export async function updateProfileAction(input: Record<string, unknown>): Promise<ActionResult> {
  try {
    const profile = await currentMember();
    const v = validateProfileUpdate(input ?? {});
    const db = await createSupabaseServerClient();
    const { error } = await db
      .from("profiles")
      .update({
        first_name: v.firstName,
        last_name: v.lastName,
        pseudo: v.pseudo,
        phone_number: v.phoneNumber,
        preferred_locale: v.preferredLocale,
      })
      .eq("id", profile.id);
    if (error) throw new ApiError(error.message, 500, error.code || "DB_ERROR");
    await setLocale(v.preferredLocale);
    revalidatePath("/", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e, "updateProfile");
  }
}

export async function changePasswordAction(input: { currentPassword: string; newPassword: string }): Promise<ActionResult> {
  try {
    const profile = await currentMember();
    await reauthenticate(profile.id, profile.email, input?.currentPassword);
    const next = Password.create(typeof input?.newPassword === "string" ? input.newPassword : "");
    const db = await createSupabaseServerClient();
    const { error } = await db.auth.updateUser({ password: next });
    if (error) throw new DomainError(error.message, "WEAK_PASSWORD");
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e, "changePassword");
  }
}

async function endAccount(rpc: "deactivate_my_account" | "delete_my_account", password: unknown): Promise<ActionResult> {
  try {
    const profile = await currentMember();
    await reauthenticate(profile.id, profile.email, password);
    const db = await createSupabaseServerClient();
    const { error } = await db.rpc(rpc);
    if (error) {
      // Le dernier super administrateur actif ne peut pas quitter la plateforme (US-010).
      if (/dernier/i.test(error.message)) throw new DomainError(error.message, "LAST_SUPER_ADMIN");
      throw new ApiError(error.message, 500, error.code || "DB_ERROR");
    }
    // Révoque TOUTES les sessions de l'utilisateur (tous appareils) et efface les cookies.
    await db.auth.signOut({ scope: "global" });
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e, rpc);
  }
}

/** US-008 : désactive son propre compte (réversible par l'administration), après ré-authentification. */
export async function deactivateAccountAction(input: { password: string }): Promise<ActionResult> {
  return endAccount("deactivate_my_account", input?.password);
}

/** US-009 / US-010 : suppression logique de son propre compte, après ré-authentification. */
export async function deleteAccountAction(input: { password: string }): Promise<ActionResult> {
  return endAccount("delete_my_account", input?.password);
}
