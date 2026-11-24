import type { Page } from "@/shared/domain/Page";
import type { StudentFilters, StudentSummary } from "../domain/entities/Student";

export interface IStudentRepository {
  list(filters: StudentFilters): Promise<Page<StudentSummary>>;
  /** Fiche de l'étudiant connecté (via RLS) ou d'un étudiant précis pour l'administrateur. */
  findByUserId(userId: string): Promise<StudentSummary | null>;
  count(): Promise<number>;
}
