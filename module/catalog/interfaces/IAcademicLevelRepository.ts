import type { AcademicLevel } from "../domain/entities/AcademicLevel";

export interface IAcademicLevelRepository {
  findAll(): Promise<AcademicLevel[]>;
}
