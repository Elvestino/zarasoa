import type { Filiere } from "../domain/entities/Filiere";

export interface IFiliereRepository {
  /** Toutes les filières avec leurs parcours (actifs ou non). */
  findAllWithParcours(): Promise<Filiere[]>;
  createFiliere(input: { code: string; name: string; facultyName?: string }): Promise<void>;
  createParcours(input: { filiereId: string; code: string; name: string }): Promise<void>;
  updateFiliere(id: string, input: { code: string; name: string; facultyName?: string }): Promise<void>;
  updateParcours(id: string, input: { code: string; name: string }): Promise<void>;
  /** Refusée (CATALOG_IN_USE) si la filière a encore des parcours, des matières, des étudiants ou des lignes de registre. */
  deleteFiliere(id: string): Promise<void>;
  /** Refusée (CATALOG_IN_USE) si le parcours est encore utilisé. */
  deleteParcours(id: string): Promise<void>;
  setFiliereActive(id: string, active: boolean): Promise<void>;
  setParcoursActive(id: string, active: boolean): Promise<void>;
}
