import { DomainError } from "@/shared/errors/DomainError";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Email = {
  /** Normalise (trim + minuscules) et valide. Lève une DomainError si invalide. */
  create(raw: string): string {
    const value = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value) || value.length > 254) {
      throw new DomainError("Adresse e-mail invalide.", "INVALID_EMAIL");
    }
    return value;
  },
};
