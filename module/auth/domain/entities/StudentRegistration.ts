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

/** Valide et normalise : utilisée côté navigateur ET côté serveur (la route ne fait jamais confiance au client). */
export function validateStudentRegistration(input: StudentRegistration): StudentRegistration {
  const dateOfBirth = optional(input.dateOfBirth, 10, "Date de naissance");
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    throw new DomainError("Date de naissance invalide.", "INVALID_DATE");
  }
  return {
    email: Email.create(input.email),
    password: Password.create(input.password),
    firstName: requiredName(input.firstName, "Prénom"),
    lastName: requiredName(input.lastName, "Nom"),
    pseudo: optional(input.pseudo, 200, "Pseudo"),
    phoneNumber: optional(input.phoneNumber, 25, "Téléphone"),
    registrationNumber: RegistrationNumber.create(input.registrationNumber),
    dateOfBirth,
  };
}
