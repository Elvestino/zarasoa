export const REGISTRY_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const REGISTRY_MAX_ROWS = 20000;
export const REGISTRY_ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

/** Même règle que public.normalize_registration_number en base : trim + majuscules. */
export const normalizeRegistrationNumber = (raw: string): string => raw.trim().toUpperCase();

export type RowStatus = "valid" | "duplicate" | "invalid";

/** Colonnes du fichier que l'import sait reconnaître et écrire dans official_student_registry. */
export const REGISTRY_FIELDS = ["registrationNumber", "lastName", "firstName", "dateOfBirth", "filiere", "parcours", "level", "status"] as const;
export type RegistryField = (typeof REGISTRY_FIELDS)[number];

/** Le matricule identifie la ligne : cette colonne est toujours importée. */
export const REQUIRED_REGISTRY_FIELD: RegistryField = "registrationNumber";

/** Une colonne de l'en-tête du fichier, telle qu'affichée dans l'aperçu (case à cocher). */
export interface PreviewColumn {
  /** Libellé unique de la colonne (clé de `cells`). */
  key: string;
  /** Champ du registre reconnu pour cette colonne, ou null si elle n'est pas reconnue (alors ignorée). */
  field: RegistryField | null;
}

/**
 * Champs que l'administrateur a décochés. Le matricule ne peut jamais être exclu ; le parcours dépend de la filière
 * (clé étrangère composite en base) : sans filière, il n'est pas importé non plus.
 */
export function sanitizeExcludedFields(raw: unknown): RegistryField[] {
  const list = Array.isArray(raw) ? raw : [];
  const set = new Set<RegistryField>(
    list.filter((f): f is RegistryField => (REGISTRY_FIELDS as readonly string[]).includes(String(f)) && f !== REQUIRED_REGISTRY_FIELD),
  );
  if (set.has("filiere")) set.add("parcours");
  return [...set];
}

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
  /** Toutes les colonnes de l'en-tête du fichier, dans l'ordre. */
  columns: PreviewColumn[];
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
  /** Colonnes du fichier (aperçu avec case à cocher « importer cette colonne »). */
  columns: PreviewColumn[];
  /** Les premières lignes, pour contrôle visuel avant confirmation. */
  sample: Pick<ParsedRegistryRow, "rowNumber" | "normalizedNumber" | "status" | "errorCode" | "cells">[];
}
