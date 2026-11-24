"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/shared/errors/DomainError";
import { requireText, requireUuid } from "@/shared/domain/validation";
import type { ActionResult } from "@/shared/domain/Page";
import { failure } from "@/shared/infrastructure/actionError";
import { requireRoleForAction } from "@/module/user/infrastructure/server/guards";
import { canApprove } from "../../domain/entities/RegistrationRequest";
import { RegistrationRequestRepository } from "../repository/RegistrationRequestRepository";

const done = (): ActionResult => {
  revalidatePath("/admin", "layout");
  return { ok: true, data: undefined };
};

export async function checkRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await new RegistrationRequestRepository(db).check(requireUuid(requestId));
    return done();
  } catch (e) {
    return failure(e, "checkRequest");
  }
}

export async function checkAllRequestsAction(): Promise<ActionResult<{ checked: number }>> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    const checked = await new RegistrationRequestRepository(db).checkAllPending();
    revalidatePath("/admin", "layout");
    return { ok: true, data: { checked } };
  } catch (e) {
    return failure(e, "checkAllRequests");
  }
}

/** US-021 : approuve un étudiant — uniquement si l'e-mail est confirmé ET si le matricule figure dans le registre officiel. */
export async function approveRequestAction(input: {
  requestId: string;
  filiereId: string;
  parcoursId?: string;
  levelId: string;
}): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    const repo = new RegistrationRequestRepository(db);
    const requestId = requireUuid(input?.requestId);
    const request = await repo.findById(requestId);
    if (!request) throw new DomainError("Demande introuvable.", "REQUEST_NOT_FOUND");
    if (request.status !== "pending_admin") throw new DomainError("Demande non traitable.", "REQUEST_NOT_PROCESSABLE");
    if (!canApprove(request)) throw new DomainError("Matricule absent du registre.", "NOT_IN_REGISTRY");

    await repo.approve({
      requestId,
      filiereId: requireUuid(input.filiereId),
      parcoursId: input.parcoursId ? requireUuid(input.parcoursId) : null,
      levelId: requireUuid(input.levelId),
    });
    return done();
  } catch (e) {
    return failure(e, "approveRequest");
  }
}

/** US-022 : refuse une demande avec un motif obligatoire (visible par l'étudiant). */
export async function rejectRequestAction(input: { requestId: string; reason: string }): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await new RegistrationRequestRepository(db).reject(requireUuid(input?.requestId), requireText(input?.reason, 3, 500, "REASON_REQUIRED"));
    return done();
  } catch (e) {
    return failure(e, "rejectRequest");
  }
}
