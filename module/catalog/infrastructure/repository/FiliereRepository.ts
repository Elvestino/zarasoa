import { ApiError } from "@/shared/errors/ApiError";
import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { Filiere } from "../../domain/entities/Filiere";
import type { IFiliereRepository } from "../../interfaces/IFiliereRepository";

interface ParcoursRow {
  id: string;
  filiere_id: string;
  code: string;
  name: string;
  is_active: boolean;
}
interface FiliereRow {
  id: string;
  code: string;
  name: string;
  faculty_name: string | null;
  is_active: boolean;
}

export class FiliereRepository extends BaseRepository implements IFiliereRepository {
  constructor(db: Db) {
    super(db);
  }

  async findAllWithParcours(): Promise<Filiere[]> {
    const [filieres, parcours] = await Promise.all([
      this.db.from("filieres").select("id, code, name, faculty_name, is_active").order("name"),
      this.db.from("parcours").select("id, filiere_id, code, name, is_active").order("name"),
    ]);
    const fRows = (this.unwrap(filieres, "Lecture des filières impossible") ?? []) as FiliereRow[];
    const pRows = (this.unwrap(parcours, "Lecture des parcours impossible") ?? []) as ParcoursRow[];

    return fRows.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      facultyName: f.faculty_name,
      isActive: f.is_active,
      parcours: pRows
        .filter((p) => p.filiere_id === f.id)
        .map((p) => ({ id: p.id, filiereId: p.filiere_id, code: p.code, name: p.name, isActive: p.is_active })),
    }));
  }

  async createFiliere(input: { code: string; name: string; facultyName?: string }): Promise<void> {
    const { error } = await this.db
      .from("filieres")
      .insert({ code: input.code, name: input.name, faculty_name: input.facultyName ?? null });
    if (error) throw this.mapError(error.code, error.message, "FILIERE_CODE_TAKEN");
  }

  async createParcours(input: { filiereId: string; code: string; name: string }): Promise<void> {
    const { error } = await this.db
      .from("parcours")
      .insert({ filiere_id: input.filiereId, code: input.code, name: input.name });
    if (error) throw this.mapError(error.code, error.message, "PARCOURS_CODE_TAKEN");
  }

  async updateFiliere(id: string, input: { code: string; name: string; facultyName?: string }): Promise<void> {
    const { error } = await this.db
      .from("filieres")
      .update({ code: input.code, name: input.name, faculty_name: input.facultyName ?? null })
      .eq("id", id);
    if (error) throw this.mapError(error.code, error.message, "FILIERE_CODE_TAKEN");
  }

  async updateParcours(id: string, input: { code: string; name: string }): Promise<void> {
    const { error } = await this.db.from("parcours").update({ code: input.code, name: input.name }).eq("id", id);
    if (error) throw this.mapError(error.code, error.message, "PARCOURS_CODE_TAKEN");
  }

  async deleteFiliere(id: string): Promise<void> {
    const { error } = await this.db.from("filieres").delete().eq("id", id);
    if (error) throw this.mapError(error.code, error.message, "FILIERE_CODE_TAKEN");
  }

  async deleteParcours(id: string): Promise<void> {
    const { error } = await this.db.from("parcours").delete().eq("id", id);
    if (error) throw this.mapError(error.code, error.message, "PARCOURS_CODE_TAKEN");
  }

  async setFiliereActive(id: string, active: boolean): Promise<void> {
    this.unwrap(await this.db.from("filieres").update({ is_active: active }).eq("id", id), "Mise à jour de la filière impossible");
  }

  async setParcoursActive(id: string, active: boolean): Promise<void> {
    this.unwrap(await this.db.from("parcours").update({ is_active: active }).eq("id", id), "Mise à jour du parcours impossible");
  }

  private mapError(code: string | undefined, message: string, duplicateCode: string): ApiError {
    if (code === "23505") return new ApiError("Code déjà utilisé.", 409, duplicateCode);
    // Clé étrangère : l'élément est référencé (parcours, matières, étudiants, registre) → on ne le supprime pas.
    if (code === "23503") return new ApiError("Élément encore utilisé.", 409, "CATALOG_IN_USE");
    return new ApiError(message, 500, code || "DB_ERROR");
  }
}
