import type { Page } from "@/shared/domain/Page";
import type { MyRegistrationRequest, RegistrationRequest, RequestFilters, RequestStatus } from "../domain/entities/RegistrationRequest";

export interface IRegistrationRequestRepository {
  list(filters: RequestFilters): Promise<Page<RegistrationRequest>>;
  countByStatus(): Promise<Record<RequestStatus, number>>;
  findById(id: string): Promise<RegistrationRequest | null>;
  /** Demande de l'utilisateur connecté (null si le compte n'a jamais fait de demande d'inscription étudiante). */
  findMine(userId: string): Promise<MyRegistrationRequest | null>;
  /** Compare la demande au registre officiel importé (found / mismatch / not_found). */
  check(requestId: string): Promise<void>;
  /** Compare toutes les demandes en attente pas encore confirmées. Renvoie le nombre de demandes vérifiées. */
  checkAllPending(): Promise<number>;
  approve(input: { requestId: string; filiereId: string; parcoursId: string | null; levelId: string }): Promise<void>;
  reject(requestId: string, reason: string): Promise<void>;
}
