"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/shared/errors/DomainError";
import { optionalText, requireText, requireUuid } from "@/shared/domain/validation";
import type { ActionResult } from "@/shared/domain/Page";
import { failure } from "@/shared/infrastructure/actionError";
import { isManageableRole } from "../../domain/value-object/Role";
import { AccountRepository } from "../repository/AccountRepository";
import { requireRoleForAction } from "./guards";

/**
 * Toutes les actions de ce fichier : réservées au super administrateur (revérifié ici ET dans la fonction SQL),
 * acteur / date / motif tracés en base (événement de sécurité et journal d'audit).
 */
async function run(context: string, task: (accounts: AccountRepository) => Promise<void>): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await task(new AccountRepository(db));
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e, context);
  }
}

const requiredReason = (v: unknown) => requireText(v, 3, 500, "REASON_REQUIRED");

function manageableRole(v: unknown) {
  if (!isManageableRole(v)) throw new DomainError("Rôle non gérable ici.", "ROLE_NOT_MANAGEABLE");
  return v;
}

/** US-007 : le super administrateur débloque un compte (motif facultatif, acteur et date tracés en base). */
export async function unlockAccountAction(input: { userId: string; reason?: string }): Promise<ActionResult> {
  return run("unlockAccount", (accounts) => accounts.unlock(requireUuid(input?.userId), optionalText(input?.reason, 500) ?? null));
}

/** Réactive un compte désactivé (par son titulaire) : événement `account_reactivated`, motif obligatoire. */
export async function reactivateAccountAction(input: { userId: string; reason: string }): Promise<ActionResult> {
  return run("reactivateAccount", (accounts) => accounts.reactivate(requireUuid(input?.userId), requiredReason(input?.reason)));
}

/** Suspend un compte actif : accès coupé immédiatement, réversible, motif obligatoire. */
export async function suspendAccountAction(input: { userId: string; reason: string }): Promise<ActionResult> {
  return run("suspendAccount", (accounts) => accounts.suspend(requireUuid(input?.userId), requiredReason(input?.reason)));
}

export async function liftSuspensionAction(input: { userId: string; reason: string }): Promise<ActionResult> {
  return run("liftSuspension", (accounts) => accounts.liftSuspension(requireUuid(input?.userId), requiredReason(input?.reason)));
}

/** Attribue un rôle gérable (professeur, super administrateur) — motif facultatif. */
export async function assignRoleAction(input: { userId: string; role: string; reason?: string }): Promise<ActionResult> {
  return run("assignRole", (accounts) =>
    accounts.assignRole(requireUuid(input?.userId), manageableRole(input?.role), optionalText(input?.reason, 500, "REASON_REQUIRED") ?? null),
  );
}

/** Retire un rôle gérable — motif obligatoire (conservé dans `user_roles.revocation_reason`). */
export async function revokeRoleAction(input: { userId: string; role: string; reason: string }): Promise<ActionResult> {
  return run("revokeRole", (accounts) =>
    accounts.revokeRole(requireUuid(input?.userId), manageableRole(input?.role), requiredReason(input?.reason)),
  );
}
