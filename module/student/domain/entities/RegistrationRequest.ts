export type RequestStatus = "pending_email" | "pending_admin" | "approved" | "rejected";
export type RegistryMatchStatus = "found" | "not_found" | "mismatch" | "unchecked";

export const REQUEST_STATUSES: readonly RequestStatus[] = ["pending_email", "pending_admin", "approved", "rejected"];

/** Fiche du registre officiel rapprochée de la demande (null si le matricule n'a pas été trouvé). */
export interface OfficialRecord {
  lastName: string | null;
  firstName: string | null;
  dateOfBirth: string | null;
  academicStatus: string | null;
  filiereId: string | null;
  parcoursId: string | null;
  levelId: string | null;
  filiereName: string | null;
  parcoursName: string | null;
  levelLabel: string | null;
}

export interface RegistrationRequest {
  id: string;
  userId: string;
  registrationNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  declaredDateOfBirth: string | null;
  emailConfirmedAt: Date | null;
  status: RequestStatus;
  matchStatus: RegistryMatchStatus | null;
  submittedAt: Date;
  decisionReason: string | null;
  official: OfficialRecord | null;
}

export interface RequestFilters {
  status?: RequestStatus;
  search?: string;
  page: number;
  pageSize: number;
}

/**
 * Règle métier : on n'approuve un étudiant que si son matricule figure dans le registre officiel
 * (concordance parfaite, ou concordance partielle que l'administrateur a examinée) ET si son e-mail est confirmé.
 */
export function canApprove(r: Pick<RegistrationRequest, "status" | "matchStatus">): boolean {
  return r.status === "pending_admin" && (r.matchStatus === "found" || r.matchStatus === "mismatch");
}
