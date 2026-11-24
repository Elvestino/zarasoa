import type { Filiere } from "../domain/entities/Filiere";

export interface IFiliereRepository {
  /** Toutes les filières avec leurs parcours (actifs ou non). */
  findAllWithParcours(): Promise<Filiere[]>;
  createFiliere(input: { code: string; name: string; facultyName?: string }): Promise<void>;
  createParcours(input: { filiereId: string; code: string; name: string }): Promise<void>;
  setFiliereActive(id: string, active: boolean): Promise<void>;
  setParcoursActive(id: string, active: boolean): Promise<void>;
}
