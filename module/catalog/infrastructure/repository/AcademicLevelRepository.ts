import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { AcademicLevel } from "../../domain/entities/AcademicLevel";
import type { IAcademicLevelRepository } from "../../interfaces/IAcademicLevelRepository";

interface AcademicLevelRow {
  id: string;
  code: AcademicLevel["code"];
  label: string;
  cycle: AcademicLevel["cycle"];
  sort_order: number;
  is_active: boolean;
}

export class AcademicLevelRepository extends BaseRepository implements IAcademicLevelRepository {
  constructor(db: Db) {
    super(db);
  }

  async findAll(): Promise<AcademicLevel[]> {
    const rows = this.unwrap(
      await this.db.from("academic_levels").select("id, code, label, cycle, sort_order, is_active").order("sort_order"),
      "Lecture des niveaux impossible",
    ) as AcademicLevelRow[] | null;

    return (rows ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      cycle: r.cycle,
      sortOrder: r.sort_order,
      isActive: r.is_active,
    }));
  }
}
