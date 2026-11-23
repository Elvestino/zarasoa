import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { CourseDetail, CourseSummary } from "../../domain/entities/Course";

interface CourseRow {
  id: string;
  title: string;
  summary: string | null;
  description?: string | null;
  published_at?: string | null;
  responsible_professor_id?: string;
  subjects: { code: string; name: string } | { code: string; name: string }[] | null;
}

const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

/**
 * Cours vus par l'étudiant. La RLS ne renvoie que les cours PUBLIÉS de sa filière, son niveau et son parcours
 * (ou communs à tous les parcours) : aucun filtre de périmètre n'est refait ici.
 */
export class CourseRepository extends BaseRepository {
  constructor(db: Db) {
    super(db);
  }

  async listVisible(): Promise<CourseSummary[]> {
    const rows = (this.unwrap(
      await this.db
        .from("courses")
        .select("id, title, summary, subjects(code, name)")
        .eq("course_status", "published")
        .order("title"),
      "Lecture des cours impossible",
    ) ?? []) as CourseRow[];
    return rows.map(toSummary);
  }

  async findVisibleById(id: string): Promise<CourseDetail | null> {
    const row = this.unwrap(
      await this.db
        .from("courses")
        .select("id, title, summary, description, published_at, responsible_professor_id, subjects(code, name)")
        .eq("id", id)
        .eq("course_status", "published")
        .maybeSingle(),
      "Lecture du cours impossible",
    ) as CourseRow | null;
    if (!row) return null;

    // Nom du professeur responsable : meilleur effort (si la politique d'accès ne l'autorise pas, on l'omet).
    let professorName: string | null = null;
    try {
      const prof = await this.db.from("professor_profiles").select("user_id").eq("id", row.responsible_professor_id ?? "").maybeSingle();
      const userId = (prof.data as { user_id: string } | null)?.user_id;
      if (userId) {
        const p = await this.db.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle();
        const d = p.data as { first_name: string; last_name: string } | null;
        if (d) professorName = `${d.first_name} ${d.last_name}`.trim();
      }
    } catch {
      professorName = null;
    }
    return { ...toSummary(row), description: row.description ?? null, professorName, publishedAt: row.published_at ? new Date(row.published_at) : null };
  }
}

function toSummary(r: CourseRow): CourseSummary {
  const s = one(r.subjects);
  return { id: r.id, title: r.title, summary: r.summary, subjectCode: s?.code ?? "", subjectName: s?.name ?? "" };
}
