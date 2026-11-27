export const REGISTRY_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const REGISTRY_MAX_ROWS = 20000;
export const REGISTRY_ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

/**
 * Règle de normalisation du matricule (US-017), identique côté fichier, formulaire d'inscription et base
 * (public.normalize_registration_number) : on retire les espaces de début et de fin, puis on passe en majuscules.
 * Rien d'autre n'est modifié : les espaces ou tirets à l'intérieur du matricule font partie de l'identifiant.
 */
export const normalizeRegistrationNumber = (raw: string): string => raw.trim().toUpperCase();

export type RegistryFileKind = "xlsx" | "xls" | "csv";

/** Types MIME acceptés par format (contrôlés par rapport au contenu réel du fichier, jamais au seul nom ou en-tête client). */
export const REGISTRY_MIME_BY_KIND: Record<RegistryFileKind, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

/**
 * Format réel du fichier d'après ses premiers octets (US-015) : un .xlsx est une archive ZIP, un .xls un document OLE,
 * un CSV du texte sans octet nul. Renvoie null si le contenu ne correspond pas à l'extension annoncée.
 */
export function detectRegistryFormat(buffer: Uint8Array, fileName: string): { kind: RegistryFileKind; mime: string } | null {
  const ext = REGISTRY_ACCEPTED_EXTENSIONS.find((e) => fileName.toLowerCase().endsWith(e))?.slice(1) as RegistryFileKind | undefined;
  if (!ext) return null;
  const startsWith = (sig: number[]) => sig.every((b, i) => buffer[i] === b);
  const isZip = startsWith([0x50, 0x4b, 0x03, 0x04]);
  const isOle = startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const isText = !buffer.subarray(0, 4096).includes(0) && !isZip && !isOle;
  const matches = ext === "xlsx" ? isZip : ext === "xls" ? isOle : isText;
  return matches ? { kind: ext, mime: REGISTRY_MIME_BY_KIND[ext] } : null;
}

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
  /** Parmi les lignes invalides : celles dont le matricule est vide. */
  emptyNumbers: number;
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

/** Ligne à problème (invalide, doublon ou avertissement) affichée dans l'aperçu et dans le rapport d'import. */
export interface RowIssue {
  rowNumber: number;
  registrationNumber: string | null;
  status: string;
  errorCode: string | null;
}

export interface ImportPreview {
  importId: string;
  fileName: string;
  total: number;
  valid: number;
  duplicate: number;
  invalid: number;
  /** Parmi les lignes invalides : matricule vide. */
  emptyNumbers: number;
  warnings: number;
  /** Lignes valides dont le matricule est absent du registre (seront ajoutées) ou déjà présent (seront mises à jour). */
  willInsert: number;
  willUpdate: number;
  /** Toutes les lignes à problème, dans l'ordre du fichier (plafonnées à ISSUES_PREVIEW_LIMIT). */
  issues: RowIssue[];
  missingColumns: string[];
  /** Colonnes du fichier (aperçu avec case à cocher « importer cette colonne »). */
  columns: PreviewColumn[];
  /** Les premières lignes, pour contrôle visuel avant confirmation. */
  sample: Pick<ParsedRegistryRow, "rowNumber" | "normalizedNumber" | "status" | "errorCode" | "cells">[];
}

export const ISSUES_PREVIEW_LIMIT = 200;

/** Rapport d'un import terminé (US-018) : compteurs et erreurs rattachées à leur ligne. */
export interface ImportReport extends ImportSummary {
  emptyNumbers: number;
  warnings: number;
  excludedFields: string[];
  issues: (RowIssue & { message: string | null })[];
  issuesTruncated: boolean;
}
