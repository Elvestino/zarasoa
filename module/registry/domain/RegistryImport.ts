export const REGISTRY_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const REGISTRY_MAX_ROWS = 20000;
export const REGISTRY_ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

/** Même règle que public.normalize_registration_number en base : trim + majuscules. */
export const normalizeRegistrationNumber = (raw: string): string => raw.trim().toUpperCase();

export type RowStatus = "valid" | "duplicate" | "invalid";

/** Fiche prête à être écrite dans official_student_registry. */
export interface RegistryRecord {
  registrationNumber: string;
  lastName: string | null;
  firstName: string | null;
  dateOfBirth: string | null;
  filiereId: string | null;
  parcoursId: string | null;
  levelId: string | null;
  academicStatus: string | null;
}

export interface ParsedRegistryRow {
  rowNumber: number;
  cells: Record<string, string>;
  normalizedNumber: string | null;
  status: RowStatus;
  /** Sur une ligne valide, un code = avertissement (ex. filière inconnue) ; sur une ligne invalide, la cause. */
  errorCode: string | null;
  errorMessage: string | null;
  record: RegistryRecord | null;
}

export interface ParsedRegistry {
  rows: ParsedRegistryRow[];
  total: number;
  valid: number;
  duplicate: number;
  invalid: number;
  warnings: number;
  /** Colonnes attendues non trouvées dans l'en-tête (la colonne matricule est obligatoire). */
  missingColumns: string[];
}

export interface ImportSummary {
  id: string;
  fileName: string;
  status: string;
  total: number;
  inserted: number;
  updated: number;
  duplicate: number;
  invalid: number;
  createdAt: Date;
  finishedAt: Date | null;
}

export interface ImportPreview {
  importId: string;
  fileName: string;
  total: number;
  valid: number;
  duplicate: number;
  invalid: number;
  warnings: number;
  missingColumns: string[];
  /** Les premières lignes, pour contrôle visuel avant confirmation. */
  sample: Pick<ParsedRegistryRow, "rowNumber" | "normalizedNumber" | "status" | "errorCode" | "cells">[];
}
