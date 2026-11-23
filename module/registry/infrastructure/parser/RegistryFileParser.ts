import * as XLSX from "xlsx";
import { DomainError } from "@/shared/errors/DomainError";
import type { Filiere } from "@/module/catalog/domain/entities/Filiere";
import type { AcademicLevel } from "@/module/catalog/domain/entities/AcademicLevel";
import {
  REGISTRY_MAX_ROWS,
  normalizeRegistrationNumber,
  type ParsedRegistry,
  type ParsedRegistryRow,
} from "../../domain/RegistryImport";

type Field = "registrationNumber" | "lastName" | "firstName" | "dateOfBirth" | "filiere" | "parcours" | "level" | "status";

/** Synonymes d'en-têtes (comparés sans accents, majuscules ni ponctuation). Le vrai fichier administratif pourra en ajouter. */
const HEADER_SYNONYMS: Record<Field, string[]> = {
  registrationNumber: ["matricule", "nmatricule", "nomatricule", "numatricule", "numeromatricule", "registrationnumber", "studentid", "numeroetudiant"],
  lastName: ["nom", "nomdefamille", "nomfamille", "lastname", "surname"],
  firstName: ["prenom", "prenoms", "firstname", "givenname"],
  dateOfBirth: ["datedenaissance", "datenaissance", "naissance", "nele", "neele", "dateofbirth", "dob"],
  filiere: ["filiere", "mention", "department"],
  parcours: ["parcours", "option", "specialite"],
  level: ["niveau", "level", "annee", "anneedetude"],
  status: ["statut", "status", "situation"],
};

const flat = (v: unknown): string =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const text = (v: unknown): string => (v instanceof Date ? "" : String(v ?? "")).replace(/\s+/g, " ").trim();

/** Date Excel (numéro de série), JJ/MM/AAAA, JJ-MM-AAAA ou AAAA-MM-JJ → AAAA-MM-JJ ; null si illisible. */
function parseDate(v: unknown): string | null {
  let y: number, m: number, d: number;
  if (typeof v === "number" && v > 1 && v < 80000) {
    const p = XLSX.SSF.parse_date_code(v);
    if (!p) return null;
    ({ y, m, d } = p);
  } else {
    const s = text(v);
    const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(s);
    const fr = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
    if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    else if (fr) [d, m, y] = [Number(fr[1]), Number(fr[2]), Number(fr[3])];
    else return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  const real = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  if (!real || y < 1900 || date.getTime() > Date.now()) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export interface CatalogForMapping {
  filieres: Filiere[];
  levels: AcademicLevel[];
}

/**
 * Lit un fichier Excel/CSV du registre officiel : détecte l'en-tête, normalise les matricules,
 * signale doublons / lignes invalides et rattache filière, parcours et niveau au catalogue existant.
 */
export function parseRegistryFile(buffer: Buffer, catalog: CatalogForMapping): ParsedRegistry {
  let grid: unknown[][];
  try {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]!];
    if (!sheet) throw new Error("empty");
    grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "", blankrows: false });
  } catch {
    throw new DomainError("Fichier illisible.", "FILE_UNREADABLE");
  }

  // En-tête = première ligne (parmi les 10 premières) qui contient une colonne « matricule ».
  const headerIndex = grid.slice(0, 10).findIndex((row) => row.some((c) => HEADER_SYNONYMS.registrationNumber.includes(flat(c))));
  if (headerIndex < 0) {
    throw new DomainError("Colonne matricule introuvable.", "MISSING_REGISTRATION_COLUMN");
  }
  const columns = new Map<Field, number>();
  grid[headerIndex]!.forEach((cell, i) => {
    const key = flat(cell);
    for (const field of Object.keys(HEADER_SYNONYMS) as Field[]) {
      if (!columns.has(field) && HEADER_SYNONYMS[field].includes(key)) columns.set(field, i);
    }
  });
  const missingColumns = (["lastName", "firstName", "dateOfBirth"] as Field[]).filter((f) => !columns.has(f));
  const headers = grid[headerIndex]!.map(text);

  const dataRows = grid.slice(headerIndex + 1);
  if (dataRows.length > REGISTRY_MAX_ROWS) throw new DomainError("Trop de lignes.", "TOO_MANY_ROWS");

  const levelByKey = new Map<string, string>();
  for (const l of catalog.levels) {
    levelByKey.set(flat(l.code), l.id);
    levelByKey.set(flat(l.label), l.id);
  }
  const filiereByKey = new Map<string, Filiere>();
  for (const f of catalog.filieres) {
    filiereByKey.set(flat(f.code), f);
    filiereByKey.set(flat(f.name), f);
  }

  const seen = new Set<string>();
  const rows: ParsedRegistryRow[] = [];
  let valid = 0, duplicate = 0, invalid = 0, warnings = 0;

  dataRows.forEach((cells, i) => {
    const rowNumber = headerIndex + 2 + i; // numéro de ligne tel qu'affiché dans Excel
    if (cells.every((c) => text(c) === "")) return;
    const cellMap: Record<string, string> = {};
    cells.forEach((c, idx) => {
      const label = headers[idx] || `col${idx + 1}`;
      cellMap[label] = c instanceof Date ? c.toISOString().slice(0, 10) : text(c);
    });
    const get = (f: Field) => (columns.has(f) ? cells[columns.get(f)!] : "");

    const base = { rowNumber, cells: cellMap };
    const numberText = text(get("registrationNumber"));
    if (!numberText || numberText.length > 50) {
      invalid++;
      rows.push({ ...base, normalizedNumber: null, status: "invalid", record: null,
        errorCode: numberText ? "REGISTRATION_NUMBER_TOO_LONG" : "EMPTY_REGISTRATION_NUMBER",
        errorMessage: numberText ? "Matricule de plus de 50 caractères." : "Matricule vide." });
      return;
    }
    const normalized = normalizeRegistrationNumber(numberText);
    if (seen.has(normalized)) {
      duplicate++;
      rows.push({ ...base, normalizedNumber: normalized, status: "duplicate", record: null,
        errorCode: "DUPLICATE_IN_FILE", errorMessage: "Matricule déjà présent plus haut dans le fichier." });
      return;
    }
    seen.add(normalized);

    // Rattachement au catalogue : un texte inconnu ne rejette pas la ligne (l'identité est l'essentiel), il génère un avertissement.
    let warning: string | null = null;
    const filiereText = text(get("filiere"));
    const filiere = filiereText ? filiereByKey.get(flat(filiereText)) : undefined;
    if (filiereText && !filiere) warning = "UNKNOWN_FILIERE";

    const parcoursText = text(get("parcours"));
    let parcoursId: string | null = null;
    if (parcoursText) {
      const pool = filiere ? filiere.parcours : catalog.filieres.flatMap((f) => f.parcours);
      const hits = pool.filter((p) => flat(p.code) === flat(parcoursText) || flat(p.name) === flat(parcoursText));
      if (hits.length === 1) parcoursId = hits[0]!.id;
      else warning ??= "UNKNOWN_PARCOURS";
    }
    const levelText = text(get("level"));
    const levelId = levelText ? (levelByKey.get(flat(levelText)) ?? null) : null;
    if (levelText && !levelId) warning ??= "UNKNOWN_LEVEL";

    const dateRaw = get("dateOfBirth");
    const dateOfBirth = text(dateRaw) === "" ? null : parseDate(dateRaw);
    if (text(dateRaw) !== "" && !dateOfBirth) warning ??= "INVALID_DATE";

    // Le parcours n'est écrit que si la filière l'est aussi (clé étrangère composite en base).
    const filiereId = filiere?.id ?? (parcoursId ? catalog.filieres.find((f) => f.parcours.some((p) => p.id === parcoursId))?.id ?? null : null);
    if (warning) warnings++;
    valid++;
    rows.push({
      ...base,
      normalizedNumber: normalized,
      status: "valid",
      errorCode: warning,
      errorMessage: null,
      record: {
        registrationNumber: normalized,
        lastName: text(get("lastName")) || null,
        firstName: text(get("firstName")) || null,
        dateOfBirth,
        filiereId,
        parcoursId: filiereId ? parcoursId : null,
        levelId,
        academicStatus: text(get("status")) || null,
      },
    });
  });

  return { rows, total: rows.length, valid, duplicate, invalid, warnings, missingColumns };
}
