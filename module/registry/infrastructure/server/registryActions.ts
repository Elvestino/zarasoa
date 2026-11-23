"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/shared/domain/Page";
import { failure } from "@/shared/infrastructure/actionError";
import { requireRoleForAction } from "@/module/user/infrastructure/server/guards";
import { RegistryImportRepository } from "../repository/RegistryImportRepository";

export async function confirmRegistryImportAction(importId: string): Promise<ActionResult<{ inserted: number; updated: number; checkedRequests: number }>> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    const data = await new RegistryImportRepository(db).confirm(String(importId));
    revalidatePath("/admin", "layout");
    return { ok: true, data };
  } catch (e) {
    return failure(e, "confirmRegistryImport");
  }
}

export async function cancelRegistryImportAction(importId: string): Promise<ActionResult> {
  try {
    const { db } = await requireRoleForAction("super_admin");
    await new RegistryImportRepository(db).cancel(String(importId));
    return { ok: true, data: undefined };
  } catch (e) {
    return failure(e, "cancelRegistryImport");
  }
}
