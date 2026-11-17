/** Codes d'erreur échangés entre les routes `/api/auth/*` et l'interface. */
export const AUTH_ERROR_CODES = [
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_CONFIRMED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_PENDING_ADMIN",
  "ACCOUNT_REJECTED",
  "ACCOUNT_INACTIVE",
  "EMAIL_ALREADY_USED",
  "REGISTRATION_NUMBER_TAKEN",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];
