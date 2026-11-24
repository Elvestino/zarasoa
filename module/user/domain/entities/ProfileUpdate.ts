import { optionalText, requireText } from "@/shared/domain/validation";
import { DomainError } from "@/shared/errors/DomainError";

export const LOCALES = ["fr", "en", "mg"] as const;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,23}$/;

export interface ProfileUpdate {
  firstName: string;
  lastName: string;
  pseudo: string | null;
  phoneNumber: string | null;
  preferredLocale: (typeof LOCALES)[number];
}

/** Valide la modification de son propre profil (mêmes limites que l'inscription). */
export function validateProfileUpdate(raw: Record<string, unknown>): ProfileUpdate {
  const phone = optionalText(raw.phoneNumber, 25, "INVALID_PHONE");
  if (phone && !PHONE_PATTERN.test(phone)) throw new DomainError("Téléphone invalide.", "INVALID_PHONE");
  const locale = raw.preferredLocale;
  if (!(LOCALES as readonly unknown[]).includes(locale)) throw new DomainError("Langue invalide.", "INVALID_FIELD");
  return {
    firstName: requireText(raw.firstName, 1, 100, "INVALID_NAME"),
    lastName: requireText(raw.lastName, 1, 100, "INVALID_NAME"),
    pseudo: optionalText(raw.pseudo, 200) ?? null,
    phoneNumber: phone ?? null,
    preferredLocale: locale as ProfileUpdate["preferredLocale"],
  };
}
