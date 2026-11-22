export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRuleId = "minLength" | "letter" | "digit" | "uppercase" | "special";

export interface PasswordRule {
  id: PasswordRuleId;
  test: (raw: string) => boolean;
}

/**
 * Conditions d'un mot de passe NOUVEAU (inscription, réinitialisation).
 * Source unique : utilisée par l'interface (liste rouge/verte en direct) ET par le domaine (Password.create).
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "minLength", test: (raw) => raw.length >= PASSWORD_MIN_LENGTH },
  { id: "letter", test: (raw) => /\p{L}/u.test(raw) },
  { id: "digit", test: (raw) => /\d/.test(raw) },
  { id: "uppercase", test: (raw) => /\p{Lu}/u.test(raw) },
  // Tout ce qui n'est ni lettre, ni chiffre, ni espace : @ % $ # ! ? * - _ etc.
  { id: "special", test: (raw) => /[^\p{L}\p{N}\s]/u.test(raw) },
];

export interface PasswordRuleResult {
  id: PasswordRuleId;
  valid: boolean;
}

/** Vérifie chaque condition pour la saisie courante (appelée à chaque frappe). */
export function checkPassword(raw: string): PasswordRuleResult[] {
  return PASSWORD_RULES.map((rule) => ({ id: rule.id, valid: rule.test(raw) }));
}

export function isPasswordValid(raw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(raw));
}
