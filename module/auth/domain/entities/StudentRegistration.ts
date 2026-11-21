import { Email } from "../value-object/Email";
import { Password } from "../value-object/Password";
import { RegistrationNumber } from "../value-object/RegistrationNumber";
import { DomainError } from "@/shared/errors/DomainError";

/** Demande de préinscription d'un étudiant (module 02 de la conception). */
export interface StudentRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  pseudo?: string;
  phoneNumber?: string;
  registrationNumber: string;
  /** Format ISO AAAA-MM-JJ. */
  dateOfBirth?: string;
}

const requiredName = (raw: string, label: string): string => {
  const value = raw.trim();
  if (!value || value.length > 100) {
    throw new DomainError(`${label} obligatoire (100 caractères maximum).`, "INVALID_NAME");
  }
  return value;
};

const optional = (raw: string | undefined, max: number, label: string): string | undefined => {
  const value = raw?.trim();
  if (!value) return undefined;
  if (value.length > max) throw new DomainError(`${label} trop long (${max} caractères maximum).`, "INVALID_FIELD");
  return value;
};

const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,23}$/;

/** Date réelle (pas de 31/02), postérieure à 1900 et pas dans le futur. */
function isRealPastDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && y >= 1900 && date.getTime() <= Date.now();
}

/** Valide et normalise : utilisée côté navigateur ET côté serveur (la route ne fait jamais confiance au client). */
export function validateStudentRegistration(input: StudentRegistration): StudentRegistration {
  // Le JSON reçu peut contenir n'importe quel type : tout ce qui n'est pas du texte est traité comme vide.
  const raw = input as unknown as Record<string, unknown>;
  const str = (key: keyof StudentRegistration): string => (typeof raw[key] === "string" ? (raw[key] as string) : "");

  const dateOfBirth = optional(str("dateOfBirth"), 10, "Date de naissance");
  if (dateOfBirth && (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || !isRealPastDate(dateOfBirth))) {
    throw new DomainError("Date de naissance invalide.", "INVALID_DATE");
  }
  const phoneNumber = optional(str("phoneNumber"), 25, "Téléphone");
  if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
    throw new DomainError("Numéro de téléphone invalide.", "INVALID_PHONE");
  }
  return {
    email: Email.create(str("email")),
    password: Password.create(str("password")),
    firstName: requiredName(str("firstName"), "Prénom"),
    lastName: requiredName(str("lastName"), "Nom"),
    pseudo: optional(str("pseudo"), 200, "Pseudo"),
    phoneNumber,
    registrationNumber: RegistrationNumber.create(str("registrationNumber")),
    dateOfBirth,
  };
}
