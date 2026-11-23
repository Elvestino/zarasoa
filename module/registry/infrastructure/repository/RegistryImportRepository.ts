import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "@/shared/errors/ApiError";
import { DomainError } from "@/shared/errors/DomainError";
import { BaseRepository, type Db } from "@/shared/infrastructure/repository/BaseRepository";
import type { Json } from "@/shared/infrastructure/supabase/database.types";
import type { ImportPreview, ImportSummary, ParsedRegistry } from "../../domain/RegistryImport";

const BUCKET = "registry-imports";
const CHUNK = 500;

const chunks = <T,>(arr: T[], size = CHUNK): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

interface ImportRow {
  id: string;
  source_file_name: string;
  import_status: string;
  total_rows: number;
  inserted_rows: number;
  updated_rows: number;
  duplicate_rows: number;
  invalid_rows: number;
  created_at: string;
  finished_at: string | null;
}

/**
 * Import du registre officiel en 2 temps (US-015/016) : 1) « stage » = fichier privé + lignes analysées (rien n'est encore
 * dans le registre) ; 2) « confirm » = écriture dans official_student_registry puis vérification des demandes en attente.
 */
export class RegistryImportRepository extends BaseRepository {
  constructor(db: Db) {
    super(db);
  }

  async stage(input: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    parsed: ParsedRegistry;
    userId: string;
  }): Promise<ImportPreview> {
    const sha = createHash("sha256").update(input.buffer).digest("hex");

    // Même fichier déjà traité → refus ; même fichier jamais confirmé → on remplace l'ancien brouillon.
    const existing = this.unwrap(
      await this.db.from("registry_imports").select("id, import_status").eq("file_sha256", sha).maybeSingle(),
      "Lecture des imports impossible",
    ) as { id: string; import_status: string } | null;
    if (existing) {
      if (existing.import_status !== "ready" && existing.import_status !== "failed") {
        throw new DomainError("Fichier déjà importé.", "FILE_ALREADY_IMPORTED");
      }
      await this.cancel(existing.id);
    }

    const id = randomUUID();
    const safeName = input.fileName.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "registre";
    const storagePath = `${id}/${safeName}`;
    const upload = await this.db.storage.from(BUCKET).upload(storagePath, input.buffer, { contentType: input.mimeType, upsert: false });
    if (upload.error) throw new ApiError(upload.error.message, 500, "STORAGE_ERROR");

    const { parsed } = input;
    const insert = await this.db.from("registry_imports").insert({
      id,
      source_file_name: input.fileName.slice(0, 255),
      storage_path: storagePath,
      file_mime_type: input.mimeType.slice(0, 150),
      file_size_bytes: input.buffer.length,
      file_sha256: sha,
      import_status: "ready",
      total_rows: parsed.total,
      duplicate_rows: parsed.duplicate,
      invalid_rows: parsed.invalid,
      error_summary: { missing_columns: parsed.missingColumns, warnings: parsed.warnings },
      imported_by: input.userId,
    });
    if (insert.error) {
      await this.db.storage.from(BUCKET).remove([storagePath]);
      throw new ApiError(insert.error.message, 500, insert.error.code || "DB_ERROR");
    }

    for (const part of chunks(parsed.rows)) {
      const res = await this.db.from("registry_import_rows").insert(
        part.map((r) => ({
          import_id: id,
          row_number: r.rowNumber,
          raw_data: { cells: r.cells, record: r.record } as unknown as Json,
          normalized_registration_number: r.normalizedNumber,
          row_status: r.status,
          error_code: r.errorCode,
          error_message: r.errorMessage,
        })),
      );
      if (res.error) {
        await this.cancel(id);
        throw new ApiError(res.error.message, 500, res.error.code || "DB_ERROR");
      }
    }

    return {
      importId: id,
      fileName: input.fileName,
      total: parsed.total,
      valid: parsed.valid,
      duplicate: parsed.duplicate,
      invalid: parsed.invalid,
      warnings: parsed.warnings,
      missingColumns: parsed.missingColumns,
      sample: parsed.rows.slice(0, 100).map((r) => ({
        rowNumber: r.rowNumber,
        normalizedNumber: r.normalizedNumber,
        status: r.status,
        errorCode: r.errorCode,
        cells: r.cells,
      })),
    };
  }

  /** Écrit les lignes valides dans le registre officiel puis rapproche les demandes d'inscription en attente. */
  async confirm(importId: string): Promise<{ inserted: number; updated: number; checkedRequests: number }> {
    const imp = this.unwrap(
      await this.db.from("registry_imports").select("id, import_status").eq("id", importId).maybeSingle(),
      "Lecture de l'import impossible",
    ) as { id: string; import_status: string } | null;
    if (!imp) throw new DomainError("Import introuvable.", "IMPORT_NOT_FOUND");
    if (imp.import_status !== "ready") throw new DomainError("Import déjà traité.", "IMPORT_NOT_READY");

    this.unwrap(
      await this.db.from("registry_imports").update({ import_status: "processing", started_at: new Date().toISOString() }).eq("id", importId),
      "Démarrage de l'import impossible",
    );

    try {
      let inserted = 0;
      let updated = 0;
      // Paquets de lignes « valid » : une fois traitée, une ligne passe en inserted/updated et sort du filtre,
      // donc on relit toujours le début de la liste jusqu'à ce qu'il n'en reste plus.
      for (;;) {
        const rows = (this.unwrap(
          await this.db
            .from("registry_import_rows")
            .select("row_number, normalized_registration_number, raw_data")
            .eq("import_id", importId)
            .eq("row_status", "valid")
            .order("row_number")
            .range(0, CHUNK - 1),
          "Lecture des lignes impossible",
        ) ?? []) as { row_number: number; normalized_registration_number: string; raw_data: { record: Record<string, string | null> } }[];
        if (rows.length === 0) break;

        const numbers = rows.map((r) => r.normalized_registration_number);
        const known = new Set(
          ((this.unwrap(
            await this.db.from("official_student_registry").select("registration_number").in("registration_number", numbers),
            "Lecture du registre impossible",
          ) ?? []) as { registration_number: string }[]).map((r) => r.registration_number),
        );

        this.unwrap(
          await this.db.from("official_student_registry").upsert(
            rows.map((r) => ({
              registration_number: r.normalized_registration_number,
              last_name: r.raw_data.record.lastName,
              first_name: r.raw_data.record.firstName,
              date_of_birth: r.raw_data.record.dateOfBirth,
              filiere_id: r.raw_data.record.filiereId,
              parcours_id: r.raw_data.record.parcoursId,
              level_id: r.raw_data.record.levelId,
              academic_status: r.raw_data.record.academicStatus,
              source_import_id: importId,
              is_current: true,
            })),
            { onConflict: "registration_number" },
          ),
          "Écriture dans le registre impossible",
        );

        const newRows = rows.filter((r) => !known.has(r.normalized_registration_number)).map((r) => r.row_number);
        const oldRows = rows.filter((r) => known.has(r.normalized_registration_number)).map((r) => r.row_number);
        inserted += newRows.length;
        updated += oldRows.length;
        const now = new Date().toISOString();
        if (newRows.length) {
          this.unwrap(await this.db.from("registry_import_rows").update({ row_status: "inserted", processed_at: now }).eq("import_id", importId).in("row_number", newRows), "Mise à jour des lignes impossible");
        }
        if (oldRows.length) {
          this.unwrap(await this.db.from("registry_import_rows").update({ row_status: "updated", processed_at: now }).eq("import_id", importId).in("row_number", oldRows), "Mise à jour des lignes impossible");
        }
      }

      const counts = this.unwrap(
        await this.db.from("registry_imports").select("duplicate_rows, invalid_rows").eq("id", importId).single(),
        "Lecture de l'import impossible",
      ) as { duplicate_rows: number; invalid_rows: number };
      this.unwrap(
        await this.db.from("registry_imports").update({
          import_status: counts.duplicate_rows + counts.invalid_rows > 0 ? "completed_with_errors" : "completed",
          inserted_rows: inserted,
          updated_rows: updated,
          finished_at: new Date().toISOString(),
        }).eq("id", importId),
        "Clôture de l'import impossible",
      );

      const checked = await this.db.rpc("check_pending_requests");
      return { inserted, updated, checkedRequests: typeof checked.data === "number" ? checked.data : 0 };
    } catch (e) {
      await this.db.from("registry_imports").update({ import_status: "failed", finished_at: new Date().toISOString() }).eq("id", importId);
      throw e;
    }
  }

  /** Abandonne un brouillon d'import (fichier + lignes). Sans effet sur un import déjà confirmé. */
  async cancel(importId: string): Promise<void> {
    const imp = this.unwrap(
      await this.db.from("registry_imports").select("id, storage_path, import_status").eq("id", importId).maybeSingle(),
      "Lecture de l'import impossible",
    ) as { id: string; storage_path: string; import_status: string } | null;
    if (!imp || !["ready", "failed"].includes(imp.import_status)) return;
    await this.db.storage.from(BUCKET).remove([imp.storage_path]);
    this.unwrap(await this.db.from("registry_imports").delete().eq("id", importId), "Suppression du brouillon impossible");
  }

  async listImports(limit = 20): Promise<ImportSummary[]> {
    const rows = (this.unwrap(
      await this.db
        .from("registry_imports")
        .select("id, source_file_name, import_status, total_rows, inserted_rows, updated_rows, duplicate_rows, invalid_rows, created_at, finished_at")
        .neq("import_status", "ready")
        .order("created_at", { ascending: false })
        .limit(limit),
      "Lecture des imports impossible",
    ) ?? []) as ImportRow[];
    return rows.map((r) => ({
      id: r.id,
      fileName: r.source_file_name,
      status: r.import_status,
      total: r.total_rows,
      inserted: r.inserted_rows,
      updated: r.updated_rows,
      duplicate: r.duplicate_rows,
      invalid: r.invalid_rows,
      createdAt: new Date(r.created_at),
      finishedAt: r.finished_at ? new Date(r.finished_at) : null,
    }));
  }

  async countRegistry(): Promise<number> {
    const { count, error } = await this.db.from("official_student_registry").select("id", { count: "exact", head: true });
    if (error) throw new ApiError(error.message, 500, error.code || "DB_ERROR");
    return count ?? 0;
  }
}
