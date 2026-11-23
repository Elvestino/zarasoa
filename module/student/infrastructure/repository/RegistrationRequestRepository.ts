import { ApiError } from "@/shared/errors/ApiError";
import type { Page } from "@/shared/domain/Page";
import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import { rangeFor, sanitizeSearch } from "@/shared/infrastructure/repository/search";
import {
  REQUEST_STATUSES,
  type RegistrationRequest,
  type RegistryMatchStatus,
  type RequestFilters,
  type RequestStatus,
} from "../../domain/entities/RegistrationRequest";
import type { IRegistrationRequestRepository } from "../../interfaces/IRegistrationRequestRepository";

interface RequestRow {
  id: string;
  user_id: string;
  registration_number: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  declared_date_of_birth: string | null;
  email_confirmed_at: string | null;
  request_status: RequestStatus;
  registry_match_status: RegistryMatchStatus | null;
  matched_registry_id: string | null;
  submitted_at: string;
  decision_reason: string | null;
  official_last_name: string | null;
  official_first_name: string | null;
  official_date_of_birth: string | null;
  official_academic_status: string | null;
  official_filiere_id: string | null;
  official_parcours_id: string | null;
  official_level_id: string | null;
  official_filiere_name: string | null;
  official_parcours_name: string | null;
  official_level_label: string | null;
}

/** Lit la vue `v_registration_requests` ; les décisions passent par les fonctions SQL contrôlées (RPC) réservées au super administrateur. */
export class RegistrationRequestRepository extends BaseRepository implements IRegistrationRequestRepository {
  constructor(db: Db) {
    super(db);
  }

  async list(filters: RequestFilters): Promise<Page<RegistrationRequest>> {
    let query = this.db.from("v_registration_requests").select("*", { count: "exact" });
    if (filters.status) query = query.eq("request_status", filters.status);
    const q = sanitizeSearch(filters.search);
    if (q) {
      query = query.or(
        `last_name.ilike.%${q}%,first_name.ilike.%${q}%,registration_number.ilike.%${q}%,email.ilike.%${q}%`,
      );
    }
    const [from, to] = rangeFor(filters.page, filters.pageSize);
    const result = await query.order("submitted_at", { ascending: false }).range(from, to);
    const rows = (this.unwrap(result, "Lecture des demandes impossible") ?? []) as RequestRow[];
    return { items: rows.map(toRequest), total: result.count ?? rows.length, page: filters.page, pageSize: filters.pageSize };
  }

  async countByStatus(): Promise<Record<RequestStatus, number>> {
    const entries = await Promise.all(
      REQUEST_STATUSES.map(async (status) => {
        const { count, error } = await this.db
          .from("student_registration_requests")
          .select("id", { count: "exact", head: true })
          .eq("request_status", status);
        if (error) throw new ApiError(error.message, 500, error.code || "DB_ERROR");
        return [status, count ?? 0] as const;
      }),
    );
    return Object.fromEntries(entries) as Record<RequestStatus, number>;
  }

  async findById(id: string): Promise<RegistrationRequest | null> {
    const row = this.unwrap(
      await this.db.from("v_registration_requests").select("*").eq("id", id).maybeSingle(),
      "Lecture de la demande impossible",
    ) as RequestRow | null;
    return row ? toRequest(row) : null;
  }

  async check(requestId: string): Promise<void> {
    this.unwrap(await this.db.rpc("check_registration_request", { p_request_id: requestId }), "Vérification impossible");
  }

  async checkAllPending(): Promise<number> {
    const data = this.unwrap(await this.db.rpc("check_pending_requests"), "Vérification impossible");
    return typeof data === "number" ? data : 0;
  }

  async approve(input: { requestId: string; filiereId: string; parcoursId: string | null; levelId: string }): Promise<void> {
    const { error } = await this.db.rpc("approve_student_request", {
      p_request_id: input.requestId,
      p_filiere_id: input.filiereId,
      // Le parcours est facultatif : la fonction SQL accepte NULL, mais les types générés exigent un string.
      p_parcours_id: input.parcoursId as string,
      p_level_id: input.levelId,
    });
    if (error) throw new ApiError(error.message, error.code === "42501" ? 403 : 409, error.code === "42501" ? "FORBIDDEN" : "REQUEST_NOT_PROCESSABLE");
  }

  async reject(requestId: string, reason: string): Promise<void> {
    const { error } = await this.db.rpc("reject_student_request", { p_request_id: requestId, p_reason: reason });
    if (error) throw new ApiError(error.message, error.code === "42501" ? 403 : 409, error.code === "42501" ? "FORBIDDEN" : "REQUEST_NOT_PROCESSABLE");
  }
}

function toRequest(r: RequestRow): RegistrationRequest {
  return {
    id: r.id,
    userId: r.user_id,
    registrationNumber: r.registration_number,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    phoneNumber: r.phone_number,
    declaredDateOfBirth: r.declared_date_of_birth,
    emailConfirmedAt: r.email_confirmed_at ? new Date(r.email_confirmed_at) : null,
    status: r.request_status,
    matchStatus: r.registry_match_status,
    submittedAt: new Date(r.submitted_at),
    decisionReason: r.decision_reason,
    official: r.matched_registry_id
      ? {
          lastName: r.official_last_name,
          firstName: r.official_first_name,
          dateOfBirth: r.official_date_of_birth,
          academicStatus: r.official_academic_status,
          filiereId: r.official_filiere_id,
          parcoursId: r.official_parcours_id,
          levelId: r.official_level_id,
          filiereName: r.official_filiere_name,
          parcoursName: r.official_parcours_name,
          levelLabel: r.official_level_label,
        }
      : null,
  };
}
