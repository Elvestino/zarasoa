import { DomainError } from "@/shared/errors/DomainError";

export const PASSWORD_MIN_LENGTH = 8;

export const Password = {
  /** Règle d'un mot de passe NOUVEAU (inscription, réinitialisation). */
  create(raw: string): string {
    if (raw.length < PASSWORD_MIN_LENGTH) {
      throw new DomainError(
        `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
        "WEAK_PASSWORD",
      );
    }
    if (!/[A-Za-z]/.test(raw) || !/\d/.test(raw)) {
      throw new DomainError("Le mot de passe doit contenir au moins une lettre et un chiffre.", "WEAK_PASSWORD");
    }
    return raw;
  },
};
