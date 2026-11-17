import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/lib/container";
import { validateStudentRegistration, type StudentRegistration } from "@/module/auth/domain/entities/StudentRegistration";
import { ApiError, isApiError } from "@/shared/errors/ApiError";
import { DomainError } from "@/shared/errors/DomainError";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as StudentRegistration | null;
    if (!body) throw new ApiError("Requête invalide.", 400, "BAD_REQUEST");

    // Le client n'est jamais cru sur parole : on revalide tout côté serveur.
    const input = validateStudentRegistration(body);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
    const { registerService } = await getContainer(siteUrl);
    await registerService.register(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (isApiError(e)) return NextResponse.json(e.toJSON(), { status: e.status });
    if (e instanceof DomainError) return NextResponse.json(new ApiError(e.message, 400, e.code).toJSON(), { status: 400 });
    console.error("[api/auth/register]", e);
    return NextResponse.json(new ApiError("Erreur interne.", 500).toJSON(), { status: 500 });
  }
}
