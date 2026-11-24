import { DEFAULT_PAGE_SIZE, type Page } from "@/shared/domain/Page";
import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import { rangeFor, sanitizeSearch } from "@/shared/infrastructure/repository/search";
import type { StudentFilters, StudentSummary } from "../../domain/entities/Student";
import type { IStudentRepository } from "../../interfaces/IStudentRepository";

interface StudentRow {
  id: string;
  user_id: string;
  registration_number: string;
  enrollment_status: string;
  approved_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  account_status: string;
  filiere_id: string;
  filiere_code: string;
  filiere_name: string;
  parcours_id: string | null;
  parcours_code: string | null;
  parcours_name: string | null;
  level_id: string;
  level_code: string;
  level_label: string;
}

/** Lit la vue `v_students` (security_invoker : la RLS de l'appelant s'applique). */
export class StudentRepository extends BaseRepository implements IStudentRepository {
  constructor(db: Db) {
    super(db);
  }

  async list(filters: StudentFilters): Promise<Page<StudentSummary>> {
    let query = this.db.from("v_students").select("*", { count: "exact" });
    const q = sanitizeSearch(filters.search);
    if (q) {
      query = query.or(
        `last_name.ilike.%${q}%,first_name.ilike.%${q}%,registration_number.ilike.%${q}%,email.ilike.%${q}%`,
      );
    }
    if (filters.filiereId) query = query.eq("filiere_id", filters.filiereId);
    if (filters.levelId) query = query.eq("level_id", filters.levelId);

    const [from, to] = rangeFor(filters.page, filters.pageSize);
    const result = await query.order("last_name").order("first_name").range(from, to);
    const rows = (this.unwrap(result, "Lecture des étudiants impossible") ?? []) as StudentRow[];
    return { items: rows.map(toStudent), total: result.count ?? rows.length, page: filters.page, pageSize: filters.pageSize };
  }

  async findByUserId(userId: string): Promise<StudentSummary | null> {
    const row = this.unwrap(
      await this.db.from("v_students").select("*").eq("user_id", userId).maybeSingle(),
      "Lecture de la fiche étudiante impossible",
    ) as StudentRow | null;
    return row ? toStudent(row) : null;
  }

  async count(): Promise<number> {
    const { count, error } = await this.db.from("v_students").select("id", { count: "exact", head: true });
    if (error) throw this.unwrap({ data: null, error }, "Comptage des étudiants impossible");
    return count ?? 0;
  }
}

export { DEFAULT_PAGE_SIZE };

function toStudent(r: StudentRow): StudentSummary {
  return {
    id: r.id,
    userId: r.user_id,
    registrationNumber: r.registration_number,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phoneNumber: r.phone_number,
    accountStatus: r.account_status,
    enrollmentStatus: r.enrollment_status,
    approvedAt: new Date(r.approved_at),
    filiere: { id: r.filiere_id, code: r.filiere_code, name: r.filiere_name },
    parcours: r.parcours_id ? { id: r.parcours_id, code: r.parcours_code ?? "", name: r.parcours_name ?? "" } : null,
    level: { id: r.level_id, code: r.level_code, label: r.level_label },
  };
}
