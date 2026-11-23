import { ApiError } from "../errors/ApiError";
import { DomainError } from "../errors/DomainError";
import type { ActionResult } from "../domain/Page";

/** Transforme n'importe quelle erreur en résultat d'action (code uniquement : aucun détail technique vers le client). */
export function failure(e: unknown, context: string): ActionResult<never> {
  if (e instanceof DomainError || e instanceof ApiError) {
    if (e instanceof ApiError && e.status >= 500) console.error(`[${context}]`, e.message);
    return { ok: false, code: e.code };
  }
  console.error(`[${context}]`, e);
  return { ok: false, code: "GENERIC" };
}
