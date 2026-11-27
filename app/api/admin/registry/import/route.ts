import { NextResponse, type NextRequest } from "next/server";
import { FiliereRepository } from "@/module/catalog/infrastructure/repository/FiliereRepository";
import { AcademicLevelRepository } from "@/module/catalog/infrastructure/repository/AcademicLevelRepository";
import { REGISTRY_ACCEPTED_EXTENSIONS, REGISTRY_MAX_FILE_BYTES, detectRegistryFormat } from "@/module/registry/domain/RegistryImport";
import { parseRegistryFile } from "@/module/registry/infrastructure/parser/RegistryFileParser";
import { RegistryImportRepository } from "@/module/registry/infrastructure/repository/RegistryImportRepository";
import { requireRoleForAction } from "@/module/user/infrastructure/server/guards";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/shared/errors/ApiError";
import { DomainError } from "@/shared/errors/DomainError";

const fail = (code: string, status: number) => NextResponse.json({ error: { code } }, { status });

/** Étape 1 de l'import : reçoit le fichier Excel/CSV, l'analyse et renvoie l'aperçu (rien n'est encore écrit dans le registre). */
export async function POST(request: NextRequest) {
  try {
    const { db, profile } = await requireRoleForAction("super_admin");
    if (!rateLimit(`registry-import:${profile.id}`, 10, 10 * 60_000).ok) return fail("RATE_LIMITED", 429);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return fail("FILE_REQUIRED", 400);
    if (file.size > REGISTRY_MAX_FILE_BYTES) return fail("FILE_TOO_LARGE", 413);
    const lower = file.name.toLowerCase();
    if (!REGISTRY_ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) return fail("FILE_TYPE_NOT_ALLOWED", 415);

    const buffer = Buffer.from(await file.arrayBuffer());
    // Format réel d'après le contenu (pas seulement l'extension ni le type annoncé par le navigateur).
    const format = detectRegistryFormat(buffer, file.name);
    if (!format) return fail("FILE_CONTENT_MISMATCH", 415);
    const [filieres, levels] = await Promise.all([new FiliereRepository(db).findAllWithParcours(), new AcademicLevelRepository(db).findAll()]);
    const parsed = parseRegistryFile(buffer, { filieres, levels });
    if (parsed.total === 0) return fail("EMPTY_FILE", 422);

    const preview = await new RegistryImportRepository(db).stage({
      fileName: file.name,
      mimeType: format.mime,
      buffer,
      parsed,
      userId: profile.id,
    });
    return NextResponse.json({ data: preview });
  } catch (e) {
    if (e instanceof DomainError) return fail(e.code, 422);
    if (e instanceof ApiError) {
      if (e.status >= 500) console.error("[registry-import]", e.message);
      return fail(e.status >= 500 ? "GENERIC" : e.code, e.status >= 500 ? 500 : e.status);
    }
    console.error("[registry-import]", e);
    return fail("GENERIC", 500);
  }
}
