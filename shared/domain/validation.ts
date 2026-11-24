import { DomainError } from "../errors/DomainError";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export function requireUuid(v: unknown): string {
  if (!isUuid(v)) throw new DomainError("Identifiant invalide.", "INVALID_FIELD");
  return v;
}

/** Texte obligatoire, nettoyé, de longueur bornée. */
export function requireText(v: unknown, min: number, max: number, code = "INVALID_FIELD"): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (s.length < min || s.length > max) throw new DomainError("Champ invalide.", code);
  return s;
}

export function optionalText(v: unknown, max: number, code = "INVALID_FIELD"): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return undefined;
  if (s.length > max) throw new DomainError("Champ trop long.", code);
  return s;
}
