"use client";

import { useTranslations } from "next-intl";
import { PASSWORD_MIN_LENGTH } from "../../domain/value-object/Password";

const KNOWN_CODES = [
  "INVALID_EMAIL",
  "WEAK_PASSWORD",
  "PASSWORD_MISMATCH",
  "INVALID_REGISTRATION_NUMBER",
  "INVALID_NAME",
  "INVALID_FIELD",
  "INVALID_DATE",
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_CONFIRMED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_PENDING_ADMIN",
  "ACCOUNT_REJECTED",
  "ACCOUNT_INACTIVE",
  "EMAIL_ALREADY_USED",
  "REGISTRATION_NUMBER_TAKEN",
  "NETWORK_ERROR",
] as const;

/** Transforme un code d'erreur (DomainError / ApiError) en message dans la langue courante. */
export function useAuthError() {
  const t = useTranslations("Auth.errors");
  return (code?: string | null): string | null => {
    if (!code) return null;
    return (KNOWN_CODES as readonly string[]).includes(code)
      ? t(code as (typeof KNOWN_CODES)[number], { min: PASSWORD_MIN_LENGTH })
      : t("generic");
  };
}
