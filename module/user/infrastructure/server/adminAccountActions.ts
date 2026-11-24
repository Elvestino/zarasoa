"use server";

import { revalidatePath } from "next/cache";
import { optionalText, requireUuid } from "@/shared/domain/validation";
import type { ActionResult } from "@/shared/domain/Page";
import { failure } from "@/shared/infrastructure/actionError";
import { AccountRepository } from "../repository/AccountRepository";
import { requireRoleForAction } from "./guards";

/** US-007 : le super administrateur débloque un compte (motif facultatif, acteur et date tracés en base). */
export async function unlockAccountAction(input: { userId: string; reason?: string }): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await new AccountRepository(db).unlock(requireUuid(input?.userId), optionalText(input?.reason, 500) ?? null);
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e, "unlockAccount");
  }
}
