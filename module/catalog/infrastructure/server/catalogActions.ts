"use server";

import { revalidatePath } from "next/cache";
import { optionalText, requireText, requireUuid } from "@/shared/domain/validation";
import type { ActionResult } from "@/shared/domain/Page";
import { failure } from "@/shared/infrastructure/actionError";
import { requireRoleForAction } from "@/module/user/infrastructure/server/guards";
import { FiliereRepository } from "../repository/FiliereRepository";

const CODE = /^[A-Za-z0-9_.-]{2,30}$/;
const code = (v: unknown) => {
  const s = requireText(v, 2, 30, "INVALID_CODE").toUpperCase();
  if (!CODE.test(s)) return requireText("", 1, 1, "INVALID_CODE");
  return s;
};

const done = (): ActionResult => {
  revalidatePath("/admin", "layout");
  return { ok: true, data: undefined };
};

export async function createFiliereAction(input: { code: string; name: string; facultyName?: string }): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await new FiliereRepository(db).createFiliere({
      code: code(input?.code),
      name: requireText(input?.name, 2, 150),
      facultyName: optionalText(input?.facultyName, 150),
    });
    return done();
  } catch (e) {
    return failure(e, "createFiliere");
  }
}

export async function createParcoursAction(input: { filiereId: string; code: string; name: string }): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await new FiliereRepository(db).createParcours({
      filiereId: requireUuid(input?.filiereId),
      code: code(input?.code),
      name: requireText(input?.name, 2, 150),
    });
    return done();
  } catch (e) {
    return failure(e, "createParcours");
  }
}

/** Une filière ou un parcours utilisé est désactivé, jamais supprimé (US-024/025). */
export async function setCatalogActiveAction(input: { kind: "filiere" | "parcours"; id: string; active: boolean }): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    const repo = new FiliereRepository(db);
    const id = requireUuid(input?.id);
    if (input.kind === "filiere") await repo.setFiliereActive(id, Boolean(input.active));
    else await repo.setParcoursActive(id, Boolean(input.active));
    return done();
  } catch (e) {
    return failure(e, "setCatalogActive");
  }
}
