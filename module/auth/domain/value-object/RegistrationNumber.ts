import { DomainError } from "@/shared/errors/DomainError";

export const RegistrationNumber = {
  /** Matricule officiel : la normalisation finale (casse, espaces) est refaite en base. */
  create(raw: string): string {
    const value = raw.trim();
    if (value.length === 0 || value.length > 50) {
      throw new DomainError("Matricule invalide.", "INVALID_REGISTRATION_NUMBER");
    }
    return value;
  },
};
