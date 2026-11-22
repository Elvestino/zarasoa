import { DomainError } from "@/shared/errors/DomainError";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isPasswordValid } from "./PasswordRules";

export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH };

export const Password = {
  /** Règle d'un mot de passe NOUVEAU (inscription, réinitialisation). Conditions : voir PasswordRules.ts */
  create(raw: string): string {
    if (raw.length > PASSWORD_MAX_LENGTH) {
      throw new DomainError(`Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`, "INVALID_FIELD");
    }
    if (!isPasswordValid(raw)) {
      throw new DomainError(
        `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères, une lettre, un chiffre, une majuscule et un caractère spécial.`,
        "WEAK_PASSWORD",
      );
    }
    return raw;
  },
};
